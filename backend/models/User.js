"use strict";

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type:      String,
      required:  [true, "Email address is required"],
      unique:    true,
      trim:      true,
      lowercase: true,
      match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
      index:     true,
    },
    name: {
      type:      String,
      trim:      true,
      maxlength: [60, "Name cannot exceed 60 characters"],
      default:   "",
    },
    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true  },
    
    googleId: {
      type:   String,
      sparse: true,  // allows multiple null values with unique index
      index:  true,
},

    // Admin accounts only — never returned by default
    password:   {
      type:     String,
      select:   false,
      minlength:[6, "Password must be at least 6 characters"],
    },

    address: {
      line1:   { type: String, default: "" },
      city:    { type: String, default: "" },
      state:   { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── PRE-SAVE HOOK: Hash password if modified ────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── INSTANCE METHOD: Compare password (for admin login) ─────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ── SAFE JSON: Remove sensitive fields ──────────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);