import { useCallback, useRef, useState } from "react";

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const rzpRef = useRef(null); // hold Razorpay instance so we can close it

  const openPayment = useCallback(
    ({ razorpayOrder, keyId, user, description, onSuccess, onFailure }) => {

      // Guard: SDK must be loaded (it's in index.html so this should never fail)
      if (!window.Razorpay) {
        onFailure(
          new Error(
            "Razorpay SDK is not loaded. " +
            "Make sure the <script> tag is present in public/index.html."
          )
        );
        return;
      }

      setLoading(true);

      const options = {
        // ── Required ────────────────────────────────────────────────────────
        key:      keyId,
        amount:   razorpayOrder.amount,          // in paise
        currency: razorpayOrder.currency || "INR",
        order_id: razorpayOrder.id,              // rzp_ order id from backend

        // ── Branding ────────────────────────────────────────────────────────
        name:        "Tessa",
        description: description || "Secure Payment",
        image:       "/logo192.png",             // optional: your logo URL

        // ── Pre-fill customer details ────────────────────────────────────────
        prefill: {
          name:    user?.name    || "",
          email:   user?.email   || "",
          contact: user?.phone   ? `+91${user.phone}` : "",
        },

        // ── UI options ───────────────────────────────────────────────────────
        theme:  { color: "#2874f0" },
        modal: {
          backdropclose: false,      // prevent accidental close on backdrop click
          escape:        false,      // prevent Esc key closing modal mid-payment
          confirm_close: true,       // ask user before closing
          ondismiss: () => {
            setLoading(false);
            onFailure(new Error("Payment cancelled. You closed the checkout window."));
          },
        },

        // ── Notes (visible in Razorpay dashboard) ────────────────────────────
        notes: {
          userId: user?.id || "",
        },

        // ── Success handler ──────────────────────────────────────────────────
        // Called by Razorpay after a successful payment.
        // response = { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        handler: (response) => {
          setLoading(false);
          onSuccess({
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
      };

      // Create and open the Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzpRef.current = rzp;

      // ── Payment failure event ─────────────────────────────────────────────
      // Fired when Razorpay itself reports a payment failure
      // (distinct from the user dismissing the modal)
      rzp.on("payment.failed", (response) => {
        setLoading(false);
        onFailure(
          new Error(
            response.error?.description ||
            response.error?.reason      ||
            "Payment failed. Please try again."
          )
        );
      });

      rzp.open();
    },
    []
  );

  // Programmatically close the checkout (e.g. on route change / unmount)
  const closePayment = useCallback(() => {
    if (rzpRef.current) {
      rzpRef.current.close();
      rzpRef.current = null;
      setLoading(false);
    }
  }, []);

  return { openPayment, closePayment, loading };
};