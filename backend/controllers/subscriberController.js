const Subscriber = require("../models/Subscriber");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const nodemailer = require("nodemailer");

const getTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.subscribe = async (req, res, next) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError("Enter a valid email address", 400));
  }

  // Check if already subscribed
  const existing = await Subscriber.findOne({ email });
  if (existing) {
  if (existing.isActive) {
    return sendSuccess(
      res,
      {},
      "You're already subscribed!"
    );
  }

  existing.isActive = true;
  await existing.save();

  return sendSuccess(
    res,
    {},
    "Welcome back! You're subscribed again."
  );
}

  await Subscriber.create({ email });

  // Try sending welcome email — don't fail the request if email fails
  try {
    await getTransporter().sendMail({
      from: `"Tessa Alerts" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔔 You're on the list — Tessa Drop Alerts",
      html: `
        <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:500px;margin:auto;border-radius:12px;">
          <h2 style="font-size:24px;margin-bottom:8px;">You're in. 🎉</h2>
          <p style="color:#aaa;line-height:1.6;">
            You'll be the first to know about new drops, flash sales, and exclusive deals on 
            <strong style="color:#fff;">Tessa</strong>.
          </p>
          <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
          <p style="color:#555;font-size:12px;">
            You subscribed with ${email}.
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Log but don't crash — subscription is already saved
    console.error("Welcome email failed:", emailErr.message);
  }

  sendSuccess(res, {}, "Subscribed! Watch your inbox for drop alerts.");
};