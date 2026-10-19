const jwt = require("jsonwebtoken");

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "TESSA",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, { issuer: "TESSA" });
};

module.exports = { signToken, verifyToken };
