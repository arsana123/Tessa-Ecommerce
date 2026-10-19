const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    isFlashItem: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date },
    amount: { type: Number }, // in paise
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    payment: { type: paymentSchema, default: () => ({}) },
    orderStatus: {
      type: String,
      enum: ["created", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "created",
    },
    isFlashOrder: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound index: fast lookup per user
orderSchema.index({ userId: 1, createdAt: -1 });
// For detecting duplicate flash orders
orderSchema.index({ userId: 1, "items.productId": 1 });

module.exports = mongoose.model("Order", orderSchema);
