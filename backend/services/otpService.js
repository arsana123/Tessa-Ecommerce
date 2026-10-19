"use strict";

const crypto           = require("crypto");
const { getRedis }     = require("../config/redis");
const { sendOTPEmail } = require("./emailService");
const AppError         = require("../utils/AppError");

// ── Config ────────────────────────────────────────────────────────────────────

const OTP_TTL_SECONDS      = parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300;
const RATE_WINDOW_SECONDS  = parseInt(process.env.OTP_RATE_WINDOW_SECONDS, 10) || 300;
const MAX_SEND_ATTEMPTS    = parseInt(process.env.OTP_MAX_SEND_ATTEMPTS, 10) || 3;
const MAX_VERIFY_ATTEMPTS  = parseInt(process.env.OTP_MAX_VERIFY_ATTEMPTS, 10) || 5;
const RESEND_COOLDOWN_SEC  = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60;
const OTP_DIGITS           = 6;

// ── Redis key namespace ───────────────────────────────────────────────────────

const K = {
  otp:           (email) => `otp:value:${email}`,
  sendCount:     (email) => `otp:sends:${email}`,
  lastSentAt:    (email) => `otp:lastsent:${email}`,
  verifyAttempts:(email) => `otp:attempts:${email}`,
};

// ── OTP generation ────────────────────────────────────────────────────────────

const generateOTP = () => {
  const min = Math.pow(10, OTP_DIGITS - 1);
  const max = Math.pow(10, OTP_DIGITS) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

// ── Rate limiters ─────────────────────────────────────────────────────────────

const enforceResendCooldown = async (redis, email) => {
  const lastSent = await redis.get(K.lastSentAt(email));
  if (!lastSent) return;

  const elapsed   = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
  const remaining = RESEND_COOLDOWN_SEC - elapsed;

  if (remaining > 0) {
    throw new AppError(
      `Please wait ${remaining} second(s) before requesting a new OTP.`,
      429
    );
  }
};

const enforceSendRateLimit = async (redis, email) => {
  const key   = K.sendCount(email);
  const count = await redis.incr(key);

  if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);

  if (count > MAX_SEND_ATTEMPTS) {
    const ttl = await redis.ttl(key);
    throw new AppError(
      `Too many OTP requests. Try again in ${Math.ceil(ttl / 60)} minute(s).`,
      429
    );
  }

  return MAX_SEND_ATTEMPTS - count;
};

const enforceVerifyRateLimit = async (redis, email) => {
  const key      = K.verifyAttempts(email);
  const attempts = await redis.incr(key);

  if (attempts === 1) await redis.expire(key, OTP_TTL_SECONDS);

  if (attempts > MAX_VERIFY_ATTEMPTS) {
    await redis.del(K.otp(email));
    throw new AppError(
      "Too many incorrect attempts. Please request a new OTP.",
      429
    );
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

const sendOTP = async (email) => {
  const redis = getRedis();

  await enforceResendCooldown(redis, email);
  const attemptsLeft = await enforceSendRateLimit(redis, email);

  const otp = generateOTP();

  await Promise.all([
    // ✅ FIX: always store as string
    redis.set(K.otp(email), String(otp), "EX", OTP_TTL_SECONDS),

    redis.del(K.verifyAttempts(email)),

    redis.set(
      K.lastSentAt(email),
      Date.now().toString(),
      "EX",
      RESEND_COOLDOWN_SEC + 10
    ),
  ]);

  await sendOTPEmail(email, otp);

  return {
    expiresIn:   OTP_TTL_SECONDS,
    resendAfter: RESEND_COOLDOWN_SEC,
    attemptsLeft,
  };
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────────

const verifyOTP = async (email, otp) => {
  const redis  = getRedis();
  const stored = await redis.get(K.otp(email));

  if (!stored) {
    throw new AppError(
      "OTP has expired or was never sent. Please request a new one.",
      400
    );
  }

  await enforceVerifyRateLimit(redis, email);

  // ✅ FIX: force both values to string (prevents Buffer error)
  const storedStr = String(stored);
  const inputStr  = String(otp);

  const storedBuf = Buffer.from(storedStr, "utf8");
  const inputBuf  = Buffer.from(inputStr, "utf8");

  let isMatch = false;

  if (storedBuf.length === inputBuf.length) {
    isMatch = crypto.timingSafeEqual(storedBuf, inputBuf);
  }

  if (!isMatch) {
    throw new AppError("Incorrect OTP. Please check and try again.", 400);
  }

  await Promise.all([
    redis.del(K.otp(email)),
    redis.del(K.verifyAttempts(email)),
    redis.del(K.sendCount(email)),
    redis.del(K.lastSentAt(email)),
  ]);
};

// ── OTP META ──────────────────────────────────────────────────────────────────

const getOTPMeta = async (email) => {
  const redis = getRedis();

  const [otpTTL, lastSent] = await Promise.all([
    redis.ttl(K.otp(email)),
    redis.get(K.lastSentAt(email)),
  ]);

  const exists = otpTTL > 0;
  let resendAfter = 0;

  if (lastSent) {
    const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
    resendAfter   = Math.max(0, RESEND_COOLDOWN_SEC - elapsed);
  }

  return {
    exists,
    ttl: exists ? otpTTL : 0,
    resendAvailable: resendAfter === 0,
    resendAfter,
  };
};

module.exports = { sendOTP, verifyOTP, getOTPMeta };