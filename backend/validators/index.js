const Joi = require("joi");
const AppError = require("../utils/AppError");

// ── Validation middleware factory ─────────────────────────────────────────────

const validate = (schema, source = "body") => (req, res, next) => {
  const data = source === "body" ? req.body : source === "params" ? req.params : req.query;
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message.replace(/['"]/g, "")).join("; ");
    return next(new AppError(message, 422));
  }

  // Attach sanitized value back
  if (source === "body") req.body = value;
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const schemas = {
  // Auth
  sendOtp: Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required().messages({
      "string.pattern.base": "Phone must be exactly 10 digits",
      "any.required": "Phone number is required",
    }),
  }),

  verifyOtp: Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
      "string.length": "OTP must be 6 digits",
      "string.pattern.base": "OTP must contain only digits",
    }),
    name: Joi.string().trim().min(2).max(60).optional().allow(""),
  }),

  adminLogin: Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    password: Joi.string().min(6).required(),
  }),

  // Products
  createProduct: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    description: Joi.string().trim().max(2000).optional().allow(""),
    price: Joi.number().positive().precision(2).required(),
    mrp: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string()
      .valid("Gowns", "Tops", "Co-ords", "Sarees", "Electronics", "Fashion", "Home & Kitchen", "Sports", "Beauty", "Books", "Toys", "General")
      .required(),
    brand: Joi.string().trim().max(60).optional().allow(""),
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    tags: Joi.array().items(Joi.string()).max(10).optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),

  updateProduct: Joi.object({
    name: Joi.string().trim().min(2).max(120).optional(),
    description: Joi.string().trim().max(2000).optional().allow(""),
    price: Joi.number().positive().precision(2).optional(),
    mrp: Joi.number().positive().precision(2).optional(),
    stock: Joi.number().integer().min(0).optional(),
    category: Joi.string()
      .valid("Gowns", "Tops", "Co-ords", "Sarees", "Electronics", "Fashion", "Home & Kitchen", "Sports", "Beauty", "Books", "Toys", "General")
      .optional(),
    brand: Joi.string().trim().max(60).optional().allow(""),
    images: Joi.array().items(Joi.string().uri()).max(5).optional(),
    tags: Joi.array().items(Joi.string()).max(10).optional(),
    isFeatured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  }),

  setFlashSale: Joi.object({
    startTime: Joi.date().iso().greater("now").required().messages({
      "date.greater": "Start time must be in the future",
    }),
    endTime: Joi.date().iso().greater(Joi.ref("startTime")).required().messages({
      "date.greater": "End time must be after start time",
    }),
    salePrice: Joi.number().positive().precision(2).required(),
    flashStock: Joi.number().integer().min(1).required(),
  }),

  // Cart
  addToCart: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).max(10).default(1),
  }),

  updateCartItem: Joi.object({
    quantity: Joi.number().integer().min(1).max(10).required(),
  }),

  // Orders
  createOrder: Joi.object({
    shippingAddress: Joi.object({
      name: Joi.string().trim().min(2).max(60).required(),
      phone: Joi.string().pattern(/^\d{10}$/).required(),
      line1: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(60).required(),
      state: Joi.string().trim().min(2).max(60).required(),
      pincode: Joi.string().pattern(/^\d{6}$/).required(),
    }).required(),
  }),

  verifyPayment: Joi.object({
    orderId: Joi.string().hex().length(24).required(),
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required(),
  }),

  flashOrder: Joi.object({
    productId: Joi.string().hex().length(24).required(),
    shippingAddress: Joi.object({
      name: Joi.string().trim().min(2).max(60).required(),
      phone: Joi.string().pattern(/^\d{10}$/).required(),
      line1: Joi.string().trim().min(5).max(200).required(),
      city: Joi.string().trim().min(2).max(60).required(),
      state: Joi.string().trim().min(2).max(60).required(),
      pincode: Joi.string().pattern(/^\d{6}$/).required(),
    }).required(),
  }),
};

module.exports = { validate, schemas };
