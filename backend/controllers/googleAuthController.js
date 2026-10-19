"use strict";
const { client, getAuthUrl } = require("../config/googleOAuth");
const User       = require("../models/User");
const { signToken } = require("../utils/jwt");
const AppError   = require("../utils/AppError");

// GET /api/auth/google → redirect user to Google's consent screen
exports.redirectToGoogle = (req, res) => {
  res.redirect(getAuthUrl());
};

// GET /api/auth/google/callback → Google calls this after consent
exports.handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return next(new AppError("No auth code from Google", 400));

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();
    console.log("Google user:", { googleId, email, name }); // ADD THIS

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    console.log("Existing user found:", user ? user.email : "none"); // ADD THIS

    if (!user) {
      user = await User.create({
        email,
        name: name || "",
        googleId,
        isVerified: true,
        role: "user",
      });
      console.log("New user created:", user.email); // ADD THIS
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
      console.log("Linked googleId to existing user"); // ADD THIS
    }

    const token = signToken({ id: user._id, role: user.role });
    console.log("Token generated, redirecting to frontend"); // ADD THIS

    res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}`);

  } catch (err) {
    console.error("Google callback ERROR:", err.message); // ADD THIS
    next(err);
  }
};