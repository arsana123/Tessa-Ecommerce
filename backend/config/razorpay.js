// const Razorpay = require("razorpay");

// let instance;

// const getRazorpay = () => {
//   if (!instance) {
//     if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//       throw new Error("Razorpay keys not configured in environment variables");
//     }
//     instance = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });
//   }
//   return instance;
// };

// module.exports = { getRazorpay };


const Razorpay = require("razorpay");

/**
 * config/razorpay.js
 *
 * Lazily initialises a single Razorpay instance (singleton pattern).
 * Throws a clear error at startup if keys are missing rather than
 * failing silently at the first payment attempt.
 */

let instance;

const getRazorpay = () => {
  if (!instance) {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials missing. " +
        "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
      );
    }

    if (!keyId.startsWith("rzp_")) {
      throw new Error(
        "RAZORPAY_KEY_ID looks invalid — it should start with 'rzp_test_' or 'rzp_live_'."
      );
    }

    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    console.log(
      `Razorpay initialised [${keyId.startsWith("rzp_test_") ? "TEST" : "LIVE"} mode]`
    );
  }

  return instance;
};

module.exports = { getRazorpay };