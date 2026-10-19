"use strict";

/**
 * utils/generateToken.js
 *
 * Convenience wrapper around jwt.js for controllers that only need
 * to sign a token (not verify). Keeps controllers clean.
 *
 * Usage:
 *   const generateToken = require("../utils/generateToken");
 *   const token = generateToken({ id: user._id, role: user.role });
 */

const { signToken } = require("./jwt");

const generateToken = (payload) => signToken(payload);

module.exports = generateToken;