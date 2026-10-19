const AppError = require("../utils/AppError");

// ── Error type transformers ───────────────────────────────────────────────────

const handleCastError = (err) =>
  new AppError(`Invalid value '${err.value}' for field '${err.path}'.`, 400);

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate value '${value}' for ${field}. Please use another value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join("; ");
  return new AppError(`Validation failed: ${messages}`, 422);
};

const handleJWTError = () =>
  new AppError("Invalid authentication token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

const handleRazorpayError = (err) =>
  new AppError(
    err.error?.description || "Payment service error. Please try again.",
    err.statusCode || 502
  );

// ── Global error handler ──────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  // Transform known error types into clean AppErrors
  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  if (error.name === "CastError") error = handleCastError(error);
  else if (error.code === 11000) error = handleDuplicateKeyError(error);
  else if (error.name === "ValidationError") error = handleValidationError(error);
  else if (error.name === "JsonWebTokenError") error = handleJWTError();
  else if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
  else if (error.statusCode === 400 && error.error?.code) error = handleRazorpayError(error);

  const isProd = process.env.NODE_ENV === "production";

  // Log unexpected errors
  if (error.statusCode >= 500) {
    console.error("UNHANDLED ERROR:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
    });
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message || "An unexpected error occurred",
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = globalErrorHandler;
