"use strict";

/**
 * controllers/authController.js
 *
 * Email + password authentication flow:
 *   POST /api/auth/register    → create account, return JWT
 *   POST /api/auth/login       → verify credentials, return JWT
 *   POST /api/auth/admin/login → password login for admins
 *   GET  /api/auth/me          → profile
 *   PATCH /api/auth/me         → update profile
 */

const bcrypt               = require("bcryptjs");
const User                 = require("../models/User");
const { signToken }        = require("../utils/jwt");
const { sendSuccess }      = require("../utils/response");
const AppError             = require("../utils/AppError");

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildUserPayload = (user) => ({
  id:         user._id,
  email:      user.email,
  name:       user.name,
  role:       user.role,
  isVerified: user.isVerified,
});

const sendAuthResponse = (res, user, statusCode, message) => {
  const token = signToken({ id: user._id, role: user.role });
  sendSuccess(res, { token, user: buildUserPayload(user) }, message, statusCode);
};

// ── Email + Password Controllers ────────────────────────────────────────────

// POST /api/auth/register
exports.register = async (req, res, next) => {
  const { email, password, name } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.password) {
      return next(new AppError("An account with this email already exists. Please log in.", 409));
    }

    // Existing account was created via Google only — allow setting a password on it.
    existing.password = password;
    if (name?.trim() && !existing.name) existing.name = name.trim();
    existing.isVerified = true;
    await existing.save();

    return sendAuthResponse(res, existing, 200, "Password set successfully");
  }

  const user = await User.create({
    email,
    password,
    name:       name?.trim() || "",
    isVerified: true,
    role:       "user",
  });

  return sendAuthResponse(res, user, 201, "Account created successfully");
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  // Reject if no such user, no password set (Google-only account), or the
  // account is not a regular user (e.g. an admin) — admins must use
  // /api/auth/admin/login instead. Same generic message either way so we
  // don't leak which case applies.
  if (!user || !user.password || user.role !== "user") {
    return next(new AppError("Invalid email or password", 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (user.isActive === false) {
    return next(new AppError("Account has been deactivated", 401));
  }

  return sendAuthResponse(res, user, 200, "Login successful");
};

// ── Admin Login ───────────────────────────────────────────────────────────────

// POST /api/auth/admin/login
exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: "admin" }).select("+password");

  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Correct comparison
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  if (user.isActive === false) {
    return next(new AppError("Account has been deactivated", 401));
  }

  return sendAuthResponse(res, user, 200, "Admin login successful");
};

// ── Profile ───────────────────────────────────────────────────────────────────

// GET /api/auth/me
exports.getMe = async (req, res) => {
  sendSuccess(res, { user: buildUserPayload(req.user) }, "Profile fetched");
};

// PATCH /api/auth/me
exports.updateMe = async (req, res, next) => {
  const ALLOWED = ["name", "address"];
  const updates = {};
  ALLOWED.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (!Object.keys(updates).length) {
    return next(new AppError("No updatable fields provided", 400));
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true, runValidators: true,
  });

  sendSuccess(res, { user: buildUserPayload(user) }, "Profile updated");
};