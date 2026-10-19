const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const AppError = require("../utils/AppError");

/**
 * Authenticate: verify JWT, load user onto req.user.
 */
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  const token = auth.split(" ")[1];
  let decoded;

  try {
    decoded = verifyToken(token);
  } catch (err) {
    const message = err.name === "TokenExpiredError"
      ? "Your session has expired. Please log in again."
      : "Invalid authentication token.";
    return next(new AppError(message, 401));
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) return next(new AppError("User no longer exists.", 401));
  if (!user.isActive) return next(new AppError("Account has been deactivated.", 401));

  req.user = user;
  next();
};

/**
 * Authorize: restrict to specific roles.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError(`Access denied. Requires role: ${roles.join(" or ")}.`, 403));
  }
  next();
};

const requireAdmin = [protect, authorize("admin")];

module.exports = { protect, authorize, requireAdmin };