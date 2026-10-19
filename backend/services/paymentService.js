const crypto = require("crypto");
const { getRazorpay } = require("../config/razorpay");
const AppError = require("../utils/AppError");

/**
 * Create a Razorpay order. Amount is in rupees — we convert to paise internally.
 * Returns the Razorpay order object.
 */
const createRazorpayOrder = async (amountInRupees, receipt, notes = {}) => {
  const razorpay = getRazorpay();
  const options = {
    amount: Math.round(amountInRupees * 100), // paise
    currency: "INR",
    receipt: receipt.substring(0, 40), // Razorpay receipt max length
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify Razorpay payment signature.
 * Ensures the payment was not tampered with.
 *
 * Algorithm: HMAC-SHA256 of "<orderId>|<paymentId>" using key_secret
 * Compare with razorpay_signature from frontend.
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const isValid = expectedSignature === razorpaySignature;
  if (!isValid) throw new AppError("Payment signature verification failed. Invalid payment.", 400);

  return true;
};

/**
 * Fetch payment details from Razorpay for server-side confirmation.
 */
const fetchPayment = async (paymentId) => {
  const razorpay = getRazorpay();
  return await razorpay.payments.fetch(paymentId);
};

module.exports = { createRazorpayOrder, verifyPaymentSignature, fetchPayment };
