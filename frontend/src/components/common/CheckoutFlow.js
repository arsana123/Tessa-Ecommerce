/**
 * components/common/CheckoutFlow.js
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useRazorpay } from "../../hooks/useRazorpay";
import {
  createOrder,
  createFlashOrder,
  createPaymentOrder,
  verifyPayment,
} from "../../api";
import styles from "./CheckoutFlow.module.css";

const ADDRESS_FIELDS = [
  { key: "name",    label: "Full Name",     type: "text", col: 2, placeholder: "As on ID" },
  { key: "phone",   label: "Mobile Number", type: "tel",  col: 2, placeholder: "10 digits", maxLength: 10, inputMode: "numeric" },
  { key: "line1",   label: "Address",       type: "text", col: 1, placeholder: "House / flat no, street, area" },
  { key: "city",    label: "City",          type: "text", col: 3, placeholder: "City" },
  { key: "state",   label: "State",         type: "text", col: 3, placeholder: "State" },
  { key: "pincode", label: "PIN Code",      type: "text", col: 3, placeholder: "6 digits", maxLength: 6, inputMode: "numeric" },
];

const validateAddress = (form) => {
  if (!form.name?.trim()    || form.name.trim().length < 2)  return "Full name is required";
  if (!/^\d{10}$/.test(form.phone))                          return "Enter a valid 10-digit phone";
  if (!form.line1?.trim()   || form.line1.trim().length < 5) return "Enter a valid address";
  if (!form.city?.trim())                                    return "City is required";
  if (!form.state?.trim())                                   return "State is required";
  if (!/^\d{6}$/.test(form.pincode))                         return "Enter a valid 6-digit PIN code";
  return null;
};

export default function CheckoutFlow({ type = "cart", productId, onSuccess, onCancel }) {
  const { user }      = useAuth();
  const { fetchCart } = useCart();
  const { openPayment, closePayment, loading: paymentLoading } = useRazorpay();

  const [step,       setStep]       = useState("address");
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState({
    name:    user?.name  || "",
    phone:   user?.phone || "",
    line1:   "",
    city:    "",
    state:   "",
    pincode: "",
  });

  const isFlash = type === "flash";

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateAddress(address);
    if (validationError) { toast.error(validationError); return; }

    setSubmitting(true);
    setStep("processing");

    try {
      let dbOrderId;
      if (isFlash) {
        const { data } = await createFlashOrder({ productId, shippingAddress: address });
        dbOrderId = data.data.order.id;
      } else {
        const { data } = await createOrder({ shippingAddress: address });
        dbOrderId = data.data.order.id;
      }

      const { data: payData } = await createPaymentOrder({ orderId: dbOrderId });
      const { razorpayOrder, razorpayKeyId } = payData.data;

      openPayment({
        razorpayOrder,
        keyId:       razorpayKeyId,
        user,
        description: isFlash ? "Flash Sale Purchase" : "Tessa Order",

        onSuccess: async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
          try {
            const { data: verifyData } = await verifyPayment({
              orderId: dbOrderId,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
            });

            if (!isFlash) await fetchCart();

            setStep("done");
            toast.success(
              isFlash
                ? "Flash order confirmed!"
                : "Payment successful! Order confirmed."
            );
            onSuccess(verifyData.data.order.id);
          } catch (err) {
            toast.error(err.message || "Payment verification failed");
            setStep("address");
          } finally {
            setSubmitting(false);
          }
        },

        onFailure: (err) => {
          toast.error(err.message || "Payment failed. Please try again.");
          setStep("address");
          setSubmitting(false);
        },
      });
    } catch (err) {
      toast.error(err.message || "Failed to initiate payment");
      setStep("address");
      setSubmitting(false);
    }
  };

  const setField = (key) => (e) =>
    setAddress((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Processing state ──────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className={styles.processingState}>
        <div className={styles.spinner} />
        <p className={styles.processingText}>
          {paymentLoading ? "Waiting for payment…" : "Setting up your order…"}
        </p>
        <p className={styles.processingNote}>
          Please complete the payment in the Razorpay window.
        </p>
        <button
          className={styles.cancelLink}
          onClick={() => {
            closePayment();
            setStep("address");
            setSubmitting(false);
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Address form ──────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Shipping Address</h3>
          <p className={styles.sub}>
            {isFlash ? "Flash orders ship free within 2–3 days" : "Delivery in 4–7 business days"}
          </p>
        </div>
        {onCancel && (
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleAddressSubmit} className={styles.form} noValidate>
        <div className={styles.grid}>
          {ADDRESS_FIELDS.map(({ key, label, type, placeholder, maxLength, inputMode }) => (
            <div
              key={key}
              className={`form-group ${key === "line1" ? styles.fullWidth : ""}`}
            >
              <label className="form-label">{label} *</label>
              <input
                className="form-input"
                type={type}
                value={address[key]}
                onChange={setField(key)}
                placeholder={placeholder}
                maxLength={maxLength}
                inputMode={inputMode}
                required
              />
            </div>
          ))}
        </div>

        {/* Security strip */}
        <div className={styles.summaryStrip}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Payments are secured and encrypted by Razorpay</span>
        </div>

        <button
          type="submit"
          className={`btn btn-primary btn-full ${styles.payBtn} ${isFlash ? styles.flashPayBtn : ""}`}
          disabled={submitting}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          {submitting ? "Processing…" : "Pay with Razorpay"}
        </button>

        <div className={styles.razorpayNote}>
          <img
            src="https://checkout.razorpay.com/v1/razorpay-logo.svg"
            alt="Razorpay"
            className={styles.rzpLogo}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span>UPI · Cards · Net Banking · Wallets</span>
        </div>
      </form>
    </div>
  );
}