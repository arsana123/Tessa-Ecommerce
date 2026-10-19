/**
 * Standardized API response helpers.
 * All responses follow: { success, message, data } shape.
 */

const sendSuccess = (res, data = {}, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, message = "An error occurred", statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};

const sendPaginated = (res, data, total, page, limit, message = "Success") => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
