/**
 * routes/payment.js
 *
 * All Razorpay payment routes.
 *
 * IMPORTANT — Webhook route registration:
 *   The webhook handler needs the raw request body (Buffer), NOT parsed JSON.
 *   It is registered here with express.raw() middleware applied per-route.
 *   In server.js the global express.json() runs AFTER this router is mounted,
 *   OR you can mount this router before express.json() — see server.js comments.
 */

const router  = require("express").Router();
const ctrl    = require("../controllers/paymentController");
const express = require("express");

const { protect, requireAdmin } = require("../middleware/auth");
const { generalLimiter }        = require("../middleware/rateLimiter");
const Joi                       = require("joi");
const AppError                  = require("../utils/AppError");

// ── Inline validation helper ──────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/['"]/g, "")).join("; ");
    return next(new AppError(msg, 422));
  }
  req.body = value;
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const createOrderSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
});

const verifySchema = Joi.object({
  orderId:            Joi.string().hex().length(24).required(),
  razorpayOrderId:    Joi.string().required(),
  razorpayPaymentId:  Joi.string().required(),
  razorpaySignature:  Joi.string().required(),
});

const refundSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  reason: Joi.string().trim().max(200).optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/payment/create-order
 * Authenticated user creates a Razorpay order for an existing DB order.
 */
router.post(
  "/create-order",
  protect,
  generalLimiter,
  validate(createOrderSchema),
  ctrl.createPaymentOrder
);

/**
 * POST /api/payment/verify
 * Authenticated user submits Razorpay callback data.
 * Signature is verified server-side — critical security step.
 */
router.post(
  "/verify",
  protect,
  generalLimiter,
  validate(verifySchema),
  ctrl.verifyPayment
);

/**
 * GET /api/payment/status/:orderId
 * Poll payment + order status (fallback if webhook is delayed).
 */
router.get(
  "/status/:orderId",
  protect,
  generalLimiter,
  ctrl.getPaymentStatus
);

/**
 * POST /api/payment/refund/:paymentId   — Admin only
 * Issue a full or partial refund.
 */
router.post(
  "/refund/:paymentId",
  ...requireAdmin,
  validate(refundSchema),
  ctrl.issueRefund
);

/**
 * POST /api/payment/webhook
 *
 * Razorpay server-to-server event delivery.
 * Must use express.raw() so the body is a Buffer for HMAC verification.
 * Apply it as route-level middleware — this overrides express.json() for this
 * specific route only.
 *
 * Dashboard config:
 *   URL:    https://your-domain.com/api/payment/webhook
 *   Secret: set in RAZORPAY_WEBHOOK_SECRET env var
 *   Events: payment.captured, payment.failed, refund.processed
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),  // raw body for HMAC verification
  ctrl.handleWebhook
);

module.exports = router;