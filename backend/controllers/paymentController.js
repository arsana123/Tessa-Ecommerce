/**
 * controllers/paymentController.js
 *
 * Handles the complete Razorpay payment lifecycle as a DEDICATED controller,
 * separate from the order business logic.
 *
 * Flow:
 *   1. POST /api/payment/create-order  → create Razorpay order, return to frontend
 *   2. Frontend opens Razorpay checkout, user pays
 *   3. POST /api/payment/verify        → verify HMAC signature, confirm DB order
 *   4. POST /api/payment/webhook       → (optional) server-side event listener from Razorpay
 *   5. POST /api/payment/refund/:paymentId → issue refund via Razorpay API
 */

const crypto = require("crypto");
const Order  = require("../models/Order");
const Cart   = require("../models/Cart");
const Product = require("../models/Product");
const { getRazorpay } = require("../config/razorpay");
const { sendSuccess }  = require("../utils/response");
const AppError         = require("../utils/AppError");
const {
  markUserPurchased,
} = require("../services/flashSaleService");

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Create Razorpay order
// POST /api/payment/create-order
//
// Body: { orderId }   ← MongoDB order _id created by orderController
//
// This keeps payment creation decoupled from order creation.
// The frontend sends the DB order ID; we fetch the total and create a
// matching Razorpay order.
// ─────────────────────────────────────────────────────────────────────────────
exports.createPaymentOrder = async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) return next(new AppError("orderId is required", 400));

  // Load the pending DB order belonging to this user
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });
  if (!order) return next(new AppError("Order not found", 404));

  if (order.payment?.status === "paid") {
    return next(new AppError("This order has already been paid", 400));
  }

  if (order.orderStatus === "cancelled") {
    return next(new AppError("Cannot pay for a cancelled order", 400));
  }

  const razorpay = getRazorpay();

  // Amount is stored in rupees in DB; Razorpay requires paise (×100)
  const razorpayOrder = await razorpay.orders.create({
    amount:   Math.round(order.totalPrice * 100),
    currency: "INR",
    receipt:  `fk_${order._id.toString().slice(-12)}`,   // max 40 chars
    notes: {
      droptOrderId: order._id.toString(),
      userId:           req.user._id.toString(),
      isFlashOrder:     String(order.isFlashOrder),
    },
  });

  // Persist Razorpay order ID onto our DB order for later verification
  order.payment.razorpayOrderId = razorpayOrder.id;
  order.payment.amount          = razorpayOrder.amount;
  order.payment.status          = "pending";
  await order.save();

  sendSuccess(res, {
    // Everything the frontend Razorpay checkout needs
    razorpayOrder: {
      id:       razorpayOrder.id,
      amount:   razorpayOrder.amount,    // paise
      currency: razorpayOrder.currency,
    },
    razorpayKeyId:  process.env.RAZORPAY_KEY_ID,
    order: {
      id:         order._id,
      totalPrice: order.totalPrice,
    },
  }, "Razorpay order created. Proceed to payment.");
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify payment & confirm order
// POST /api/payment/verify
//
// Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
//
// Razorpay sends these three values to the frontend handler function after a
// successful payment. We verify the HMAC-SHA256 signature server-side — this
// is the critical security step that ensures the payment is authentic.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  const {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;

  // 1. Load order
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });
  if (!order) return next(new AppError("Order not found", 404));

  if (order.payment?.status === "paid") {
    return next(new AppError("Payment already verified for this order", 400));
  }

  // 2. Verify HMAC-SHA256 signature
  //    Formula: HMAC_SHA256(key=key_secret, data="razorpayOrderId|razorpayPaymentId")
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return next(
      new AppError("Payment signature mismatch. Possible tampering detected.", 400)
    );
  }

  // 3. Decrement DB stock for each item (atomic — only updates if stock >= qty)
  for (const item of order.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } }
    );

    if (!updated) {
      // Edge case: stock ran out between order creation and payment
      // Mark payment received but flag for manual review / auto-refund
      order.payment.status          = "paid";
      order.payment.razorpayPaymentId = razorpayPaymentId;
      order.orderStatus             = "cancelled";
      order.cancelReason            = `Stock unavailable for: ${item.name}`;
      order.cancelledAt             = new Date();
      await order.save();

      // In production: trigger refund here via Razorpay API
      return next(
        new AppError(
          `Payment received but '${item.name}' is out of stock. ` +
          "A full refund will be processed within 5-7 business days.",
          409
        )
      );
    }
  }

  // 4. Confirm the order
  order.payment.status            = "paid";
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.payment.paidAt            = new Date();
  order.orderStatus               = "confirmed";
  await order.save();

  // 5. If this was a flash order, mark purchased in Redis permanently
  if (order.isFlashOrder && order.items[0]) {
    const productId = order.items[0].productId.toString();
    await markUserPurchased(req.user._id.toString(), productId);

    // Also update flashSold counter in DB
    await Product.findByIdAndUpdate(productId, {
      $inc: { "flashSale.flashSold": 1 },
    });
  }

  // 6. Clear cart for regular orders
  if (!order.isFlashOrder) {
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
  }

  sendSuccess(res, {
    order: {
      id:          order._id,
      orderStatus: order.orderStatus,
      totalPrice:  order.totalPrice,
      paidAt:      order.payment.paidAt,
    },
  }, order.isFlashOrder
    ? "Flash order confirmed! Congratulations on grabbing the deal!"
    : "Payment verified. Order confirmed!"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/status/:orderId
//
// Returns current payment status for polling from the frontend.
// Useful when the webhook is delayed or the browser tab was closed.
// ─────────────────────────────────────────────────────────────────────────────
exports.getPaymentStatus = async (req, res, next) => {
  const order = await Order.findOne({
    _id:    req.params.orderId,
    userId: req.user._id,
  }).select("payment orderStatus totalPrice createdAt isFlashOrder");

  if (!order) return next(new AppError("Order not found", 404));

  sendSuccess(res, {
    paymentStatus: order.payment?.status || "pending",
    orderStatus:   order.orderStatus,
    totalPrice:    order.totalPrice,
    paidAt:        order.payment?.paidAt || null,
    razorpayPaymentId: order.payment?.razorpayPaymentId || null,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/refund/:paymentId   (Admin only)
//
// Issue a full or partial refund via Razorpay.
// Body: { amount }  ← optional, in RUPEES. Omit for full refund.
// ─────────────────────────────────────────────────────────────────────────────
exports.issueRefund = async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount }    = req.body;  // optional — rupees

  const razorpay = getRazorpay();

  const refundOptions = {
    speed: "normal", // "normal" = 5-7 days, "optimum" = instant if eligible
    notes: { reason: req.body.reason || "Admin-initiated refund" },
  };

  // If amount specified, convert to paise; else Razorpay refunds full amount
  if (amount) refundOptions.amount = Math.round(Number(amount) * 100);

  const refund = await razorpay.payments.refund(paymentId, refundOptions);

  // Update order payment status if a full refund
  if (!amount) {
    await Order.findOneAndUpdate(
      { "payment.razorpayPaymentId": paymentId },
      {
        "payment.status": "refunded",
        orderStatus:      "cancelled",
        cancelReason:     "Refunded by admin",
        cancelledAt:      new Date(),
      }
    );
  }

  sendSuccess(res, {
    refundId:     refund.id,
    amount:       refund.amount / 100, // back to rupees
    status:       refund.status,
    paymentId:    refund.payment_id,
    speed:        refund.speed_processed,
  }, "Refund initiated successfully");
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
//
// Razorpay sends signed events here for server-side confirmation.
// Configure this URL in: Razorpay Dashboard → Settings → Webhooks.
//
// IMPORTANT: This route must use express.raw() NOT express.json()
//            because the signature is computed on the raw body bytes.
//            Register it BEFORE the global express.json() middleware in server.js.
// ─────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res, next) => {
  const webhookSecret   = process.env.RAZORPAY_WEBHOOK_SECRET;
  const receivedSig     = req.headers["x-razorpay-signature"];

  // Skip verification if no webhook secret configured (useful in dev)
  if (webhookSecret) {
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)          // req.body is raw Buffer here
      .digest("hex");

    if (expectedSig !== receivedSig) {
      console.warn("Invalid Razorpay webhook signature — ignoring");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON payload" });
  }

  console.log(`Razorpay webhook: ${event.event}`);

  // Handle events
  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload.payment.entity;
      // Update order if not already confirmed (e.g. verify endpoint timed out)
      await Order.findOneAndUpdate(
        {
          "payment.razorpayOrderId": payment.order_id,
          "payment.status":         { $ne: "paid" },
        },
        {
          "payment.status":            "paid",
          "payment.razorpayPaymentId": payment.id,
          "payment.paidAt":            new Date(),
          orderStatus:                 "confirmed",
        }
      );
      break;
    }

    case "payment.failed": {
      const payment = event.payload.payment.entity;
      await Order.findOneAndUpdate(
        { "payment.razorpayOrderId": payment.order_id },
        { "payment.status": "failed" }
      );
      break;
    }

    case "refund.processed": {
      const refund = event.payload.refund.entity;
      await Order.findOneAndUpdate(
        { "payment.razorpayPaymentId": refund.payment_id },
        { "payment.status": "refunded" }
      );
      break;
    }

    default:
      // Acknowledge unknown events so Razorpay doesn't retry
      break;
  }

  // Always return 200 quickly — Razorpay retries on non-200
  res.status(200).json({ received: true });
};