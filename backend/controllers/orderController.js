const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { sendSuccess, sendPaginated } = require("../utils/response");
const AppError = require("../utils/AppError");
const {
  decrementFlashStock,
  restoreFlashStock,
  acquireUserLock,
  releaseUserLock,
  markUserPurchased,
  hasUserPurchased,
} = require("../services/flashSaleService");
const {
  createRazorpayOrder,
  verifyPaymentSignature,
} = require("../services/paymentService");

// ── Regular Order Flow ────────────────────────────────────────────────────────

// POST /api/orders
// Step 1: Create order from cart + create Razorpay payment order
exports.createOrder = async (req, res, next) => {
  const { shippingAddress } = req.body;
  const userId = req.user._id;

  // 1. Load cart
  const cart = await Cart.findOne({ userId }).populate(
    "items.productId",
    "name price images stock isActive"
  );
  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  // 2. Validate all items and calculate total
  let itemsPrice = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const p = item.productId;
    if (!p || !p.isActive) {
      return next(new AppError(`Product '${p?.name || "unknown"}' is no longer available`, 400));
    }
    if (p.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for '${p.name}'. Available: ${p.stock}`, 400));
    }
    const price = p.price;
    itemsPrice += price * item.quantity;
    orderItems.push({
      productId: p._id,
      name: p.name,
      image: p.images?.[0] || "",
      price,
      quantity: item.quantity,
    });
  }

  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const totalPrice = itemsPrice + shippingPrice;

  // 3. Create Razorpay order
  const razorpayOrder = await createRazorpayOrder(
    totalPrice,
    `order_${userId}_${Date.now()}`,
    { userId: userId.toString() }
  );

  // 4. Create pending order in DB
  const order = await Order.create({
    userId,
    items: orderItems,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    totalPrice,
    payment: {
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      amount: razorpayOrder.amount,
    },
    orderStatus: "created",
  });

  sendSuccess(
    res,
    {
      order: { id: order._id, totalPrice: order.totalPrice },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
    "Order created. Proceed to payment.",
    201
  );
};

// POST /api/orders/verify-payment
// Step 2: Verify Razorpay signature → confirm order → decrement stock
exports.verifyPayment = async (req, res, next) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // 1. Load order
  const order = await Order.findOne({ _id: orderId, userId: req.user._id });
  if (!order) return next(new AppError("Order not found", 404));
  if (order.payment.status === "paid") {
    return next(new AppError("Payment already verified for this order", 400));
  }

  // 2. Verify Razorpay signature (throws if invalid)
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  // 3. Decrement DB stock for each item (atomic findOneAndUpdate)
  for (const item of order.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, sold: item.quantity } }
    );
    if (!updated) {
      // Stock ran out between order creation and payment — rare edge case
      order.payment.status = "paid";
      order.payment.razorpayPaymentId = razorpayPaymentId;
      order.orderStatus = "cancelled";
      order.cancelReason = `Stock unavailable for item: ${item.name}`;
      await order.save();
      // In production: initiate refund via Razorpay here
      return next(
        new AppError(
          `Payment received but '${item.name}' went out of stock. A refund will be processed.`,
          409
        )
      );
    }
  }

  // 4. Update order as confirmed + paid
  order.payment.status = "paid";
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.payment.paidAt = new Date();
  order.orderStatus = "confirmed";
  await order.save();

  // 5. Clear user's cart
  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

  sendSuccess(res, { order }, "Payment verified. Order confirmed!");
};

// ── Flash Sale Order Flow ─────────────────────────────────────────────────────

// POST /api/orders/flash
// Atomic flash order: lock → decrement Redis stock → create Razorpay order
exports.createFlashOrder = async (req, res, next) => {
  const { productId, shippingAddress } = req.body;
  const userId = req.user._id.toString();

  // 1. Check permanent purchase marker (fast Redis lookup)
  const alreadyBought = await hasUserPurchased(userId, productId);
  if (alreadyBought) {
    return next(new AppError("You have already purchased this flash sale item", 409));
  }

  // 2. Acquire per-user distributed lock (SETNX — atomic)
  const locked = await acquireUserLock(userId, productId);
  if (!locked) {
    return next(new AppError("Your request is already being processed. Please wait.", 429));
  }

  try {
    // 3. Validate product + flash sale state
    const product = await Product.findById(productId);
    if (!product || !product.isActive) throw new AppError("Product not found", 404);

    const now = new Date();
    const flash = product.flashSale;
    if (!flash?.isActive || now < flash.startTime || now > flash.endTime) {
      throw new AppError("Flash sale is not currently active", 400);
    }

    // 4. Atomic Redis DECR — prevents overselling
    const remaining = await decrementFlashStock(productId);
    if (remaining < 0) throw new AppError("Flash sale stock is sold out", 410);

    // 5. Create Razorpay order (amount = flash price)
    const amount = flash.salePrice;
    const razorpayOrder = await createRazorpayOrder(
      amount,
      `flash_${userId}_${Date.now()}`,
      { userId, productId, type: "flash" }
    );

    // 6. Create pending order in DB
    const order = await Order.create({
      userId: req.user._id,
      items: [{
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: flash.salePrice,
        quantity: 1,
        isFlashItem: true,
      }],
      shippingAddress,
      itemsPrice: amount,
      shippingPrice: 0, // Free shipping on flash orders
      totalPrice: amount,
      payment: {
        razorpayOrderId: razorpayOrder.id,
        status: "pending",
        amount: razorpayOrder.amount,
      },
      orderStatus: "created",
      isFlashOrder: true,
    });

    sendSuccess(
      res,
      {
        order: { id: order._id, totalPrice: order.totalPrice },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        stockRemaining: remaining,
      },
      "Flash order created. Proceed to payment.",
      201
    );
  } catch (err) {
    // Release lock on any failure so user can retry
    await releaseUserLock(userId, productId);
    next(err);
  }
};

// POST /api/orders/flash/verify-payment
// Verify flash payment → confirm order → update DB stock → mark purchased
exports.verifyFlashPayment = async (req, res, next) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user._id.toString();

  const order = await Order.findOne({ _id: orderId, userId: req.user._id, isFlashOrder: true });
  if (!order) return next(new AppError("Flash order not found", 404));
  if (order.payment.status === "paid") {
    return next(new AppError("Payment already verified", 400));
  }

  // Verify signature (throws on failure)
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  // Decrement DB stock (flash stock field)
  const productId = order.items[0].productId.toString();
  await Product.findByIdAndUpdate(productId, {
    $inc: { "flashSale.flashSold": 1, sold: 1 },
  });

  // Confirm order
  order.payment.status = "paid";
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.payment.paidAt = new Date();
  order.orderStatus = "confirmed";
  await order.save();

  // Mark as purchased in Redis (permanent — prevents future flash orders)
  await markUserPurchased(userId, productId);

  sendSuccess(res, { order }, "Flash order confirmed! Congratulations!");
};

// ── Shared Order Routes ───────────────────────────────────────────────────────

// GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find({ userId: req.user._id })
      .populate("items.productId", "name images")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments({ userId: req.user._id }),
  ]);

  sendPaginated(res, orders, total, Number(page), Number(limit));
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).populate("items.productId", "name images price");

  if (!order) return next(new AppError("Order not found", 404));
  sendSuccess(res, { order });
};

// ── Admin Order Routes ────────────────────────────────────────────────────────

// GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = status ? { orderStatus: status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("userId", "phone name")
      .populate("items.productId", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  sendPaginated(res, orders, total, Number(page), Number(limit));
};

// PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderStatus: status,
      ...(status === "delivered" ? { deliveredAt: new Date() } : {}),
      ...(status === "cancelled" ? { cancelledAt: new Date() } : {}),
    },
    { new: true }
  );
  if (!order) return next(new AppError("Order not found", 404));

  sendSuccess(res, { order }, "Order status updated");
};
