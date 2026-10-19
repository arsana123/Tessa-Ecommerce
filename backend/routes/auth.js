"use strict";

/**
 * routes/auth.js
 */

const router   = require("express").Router();
const ctrl     = require("../controllers/authController");
const googleCtrl = require("../controllers/googleAuthController");
const { protect }                     = require("../middleware/auth");
const { authLimiter, generalLimiter } = require("../middleware/rateLimiter");
const Joi      = require("joi");
const AppError = require("../utils/AppError");

// ── Inline validator ──────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,
    stripUnknown:  true,
  });
  if (error) {
    const msg = error.details.map((d) => d.message.replace(/['"]/g, "")).join("; ");
    return next(new AppError(msg, 422));
  }
  req.body = value;
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email":   "Enter a valid email address",
    "any.required":   "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min":     "Password must be at least 6 characters",
    "any.required":   "Password is required",
  }),
  name:     Joi.string().trim().min(2).max(60).optional().allow(""),
});

const loginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email":   "Enter a valid email address",
    "any.required":   "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required":   "Password is required",
  }),
});

const adminLoginSchema = Joi.object({
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/register",   authLimiter, validate(registerSchema),   ctrl.register);
router.post("/login",      authLimiter, validate(loginSchema),      ctrl.login);
router.get("/google",          googleCtrl.redirectToGoogle);
router.get("/google/callback", googleCtrl.handleGoogleCallback);
router.post("/admin/login",authLimiter, validate(adminLoginSchema), ctrl.adminLogin);

router.get  ("/me", protect, generalLimiter, ctrl.getMe);
router.patch("/me", protect, generalLimiter, ctrl.updateMe);

module.exports = router;