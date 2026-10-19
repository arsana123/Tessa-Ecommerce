/**
 * hooks/useEmailOTP.js
 *
 * Manages the entire email OTP flow state.
 * Keeps all async logic out of the LoginPage component.
 *
 * Usage:
 *   const otp = useEmailOTP();
 *
 *   otp.step           — "idle" | "sending" | "sent" | "verifying" | "done"
 *   otp.error          — string | null
 *   otp.resendCountdown — seconds remaining before resend is allowed
 *   otp.expiresIn      — total OTP lifetime in seconds
 *
 *   otp.sendCode(email)         — Step 1
 *   otp.verifyCode(otp, name)   — Step 2 → returns { token, user }
 *   otp.resend()                — Resend with cooldown enforcement
 *   otp.reset()                 — Go back to email input
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { sendOtp, resendOtp, verifyOtp } from "../api";

export const useEmailOTP = () => {
  const [step,            setStep]            = useState("idle");
  const [error,           setError]           = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [expiresIn,       setExpiresIn]       = useState(0);

  const emailRef      = useRef(null);
  const countdownRef  = useRef(null);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  const startCountdown = useCallback((seconds) => {
    setResendCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────────
  const sendCode = useCallback(async (email) => {
    setError(null);
    setStep("sending");
    emailRef.current = email;

    try {
      const { data } = await sendOtp(email);
      setExpiresIn(data.data.expiresIn || 300);
      startCountdown(data.data.resendAfter || 60);
      setStep("sent");
    } catch (err) {
      setError(err.message);
      setStep("idle");
      throw err;
    }
  }, [startCountdown]);

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────────
  const verifyCode = useCallback(async (otp, name = "") => {
    setError(null);
    setStep("verifying");

    try {
      const { data } = await verifyOtp({
        email: emailRef.current,
        otp: String(otp),
        name:  name.trim(),
      });
      setStep("done");
      return data.data; // { token, user }
    } catch (err) {
      setError(err.message);
      setStep("sent"); // stay on OTP step — allow retry
      throw err;
    }
  }, []);

  // ── Resend ───────────────────────────────────────────────────────────────────
  const resend = useCallback(async () => {
    if (resendCountdown > 0) {
      throw new Error(`Please wait ${resendCountdown}s before resending`);
    }
    setError(null);
    setStep("sending");

    try {
      const { data } = await resendOtp(emailRef.current);
      startCountdown(data.data.resendAfter || 60);
      setStep("sent");
    } catch (err) {
      setError(err.message);
      setStep("sent");
      throw err;
    }
  }, [resendCountdown, startCountdown]);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setResendCountdown(0);
    setExpiresIn(0);
    emailRef.current = null;
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  return {
    step,
    error,
    resendCountdown,
    expiresIn,
    email:       emailRef.current,
    isSending:   step === "sending",
    isVerifying: step === "verifying",
    isOtpSent:   step === "sent" || step === "verifying",
    sendCode,
    verifyCode,
    resend,
    reset,
  };
};