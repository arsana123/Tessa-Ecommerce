"use strict";

/**
 * services/emailService.js
 *
 * Nodemailer transporter + OTP email template.
 *
 * Production (Gmail):
 *   1. Enable 2-Step Verification on your Google account
 *   2. myaccount.google.com → Security → App passwords → generate one for "Mail"
 *   3. Set EMAIL_USER=you@gmail.com  EMAIL_PASS=<16-char app password>
 *
 * Other SMTP providers (SendGrid, Mailgun, etc.):
 *   Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS accordingly.
 *
 * Development:
 *   Ethereal fake SMTP is used automatically — no real emails sent.
 *   Preview URL is printed to stdout.
 */

const nodemailer = require("nodemailer");
const AppError   = require("../utils/AppError");

// ── Singleton transporter ─────────────────────────────────────────────────────

let _transporter = null;

const getTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.NODE_ENV !== "production") {
    const test = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   "smtp.ethereal.email",
      port:   587,
      secure: false,
      auth:   { user: test.user, pass: test.pass },
    });
    process.stdout.write(
      JSON.stringify({
        level:   "INFO",
        event:   "MAILER_INIT",
        mode:    "ethereal",
        user:    test.user,
        preview: "https://ethereal.email",
        ts:      new Date().toISOString(),
      }) + "\n"
    );
    return _transporter;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError(
      "EMAIL_USER and EMAIL_PASS must be configured for production",
      500
    );
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || "smtp.gmail.com",
    port:   parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool:              true,
    maxConnections:    5,
    connectionTimeout: 10000,
    greetingTimeout:   5000,
  });

  // Fail fast on bad credentials
  await _transporter.verify().catch((err) => {
    _transporter = null;
    throw new AppError(
      `Email server connection failed: ${err.message}`,
      500
    );
  });

  process.stdout.write(
    JSON.stringify({
      level: "INFO",
      event: "MAILER_INIT",
      mode:  "smtp",
      host:  process.env.EMAIL_HOST || "smtp.gmail.com",
      user:  process.env.EMAIL_USER,
      ts:    new Date().toISOString(),
    }) + "\n"
  );

  return _transporter;
};

// ── OTP email template ────────────────────────────────────────────────────────

const buildOTPTemplate = (otp, expiryMins) => ({
  subject: `${otp} — Your Tessa verification code`,

  text: [
    "Your Tessa email verification code is:",
    "",
    `  ${otp}`,
    "",
    `This code expires in ${expiryMins} minutes.`,
    "Do not share this code with anyone.",
    "",
    "If you did not request this, please ignore this email.",
    "",
    "— Tessa Team",
  ].join("\n"),

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Tessa Verification</title>
</head>
<body style="margin:0;padding:0;background:#f1f3f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#f1f3f6;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.09);overflow:hidden;" cellpadding="0" cellspacing="0">

          <tr>
            <td style="background:linear-gradient(135deg,#1565c0,#2874f0);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.5px;">Tessa</h1>
              <p style="margin:5px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Email Verification Code</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:15px;color:#424242;font-weight:500;">Use this code to verify your email</p>
              <p style="margin:0 0 24px;font-size:13px;color:#9e9e9e;">Do not share this code with anyone</p>

              <div style="display:inline-block;background:#f5f7fa;border:2px dashed #2874f0;border-radius:10px;padding:20px 44px;margin-bottom:24px;">
                <span style="font-size:38px;font-weight:900;letter-spacing:12px;color:#1565c0;font-family:'Courier New',Courier,monospace;">${otp}</span>
              </div>

              <p style="margin:0;font-size:13px;color:#757575;">
                This code is valid for <strong style="color:#212121;">${expiryMins} minutes</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #eeeeee;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#bdbdbd;line-height:1.6;">
                If you did not request this code, you can safely ignore this email.<br/>
                This is an automated message — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
});

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * sendOTPEmail(to, otp)
 *
 * @param {string} to   Recipient email address
 * @param {string} otp  6-digit OTP (generated by otpService — NOT by this module)
 */
const sendOTPEmail = async (to, otp) => {
  const transport  = await getTransporter();
  const expiryMins = Math.ceil(
    (parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300) / 60
  );
  const tpl = buildOTPTemplate(otp, expiryMins);

  const info = await transport.sendMail({
    from:    `"Tessa" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@TESSA.com"}>`,
    to,
    subject: tpl.subject,
    text:    tpl.text,
    html:    tpl.html,
  }).catch((err) => {
    throw new AppError(
      `Failed to send verification email. Please try again. (${err.message})`,
      503
    );
  });

  if (process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    process.stdout.write(
      JSON.stringify({
        level:      "DEBUG",
        event:      "OTP_EMAIL_SENT",
        to:         to.replace(/(?<=.{3}).(?=.*@)/g, "*"),
        messageId:  info.messageId,
        previewUrl,
        ts:         new Date().toISOString(),
      }) + "\n"
    );
  }

  return info.messageId;
};

module.exports = { sendOTPEmail };