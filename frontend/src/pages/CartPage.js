import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { removeFromCart, updateCartItem, createOrder, verifyPayment } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useRazorpay } from "../hooks/useRazorpay";
import styles from "./CartPage.module.css";

/* ── Address Modal ─────────────────────────────────────────────────────────── */
const AddressModal = ({ onConfirm, onClose, loading, user }) => {
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    line1: "", city: "", state: "", pincode: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim())                                   { toast.error("Please enter your name");              return false; }
    if (!form.phone.trim() || form.phone.length < 10)        { toast.error("Enter a valid 10-digit phone");        return false; }
    if (!form.line1.trim())                                  { toast.error("Please enter your address");           return false; }
    if (!form.city.trim())                                   { toast.error("Please enter your city");              return false; }
    if (!form.state.trim())                                  { toast.error("Please enter your state");             return false; }
    if (!form.pincode.trim() || form.pincode.length < 6)     { toast.error("Enter a valid 6-digit pincode");      return false; }
    return true;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div className={styles.modalIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Shipping Address</h3>
              <p className={styles.modalSub}>Where should we deliver your order?</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={set("name")} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="10-digit phone" maxLength={10} inputMode="numeric" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 1 *</label>
            <input className="form-input" value={form.line1} onChange={set("line1")} placeholder="House/flat no, street, area, landmark" />
          </div>
          <div className={styles.formRow3}>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input className="form-input" value={form.city} onChange={set("city")} placeholder="City" />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <input className="form-input" value={form.state} onChange={set("state")} placeholder="State" />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input className="form-input" value={form.pincode} onChange={set("pincode")} placeholder="6-digit" maxLength={6} inputMode="numeric" />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={styles.checkoutBtn}
            onClick={() => validate() && onConfirm(form)}
            disabled={loading}
            style={{ width: "auto", minWidth: 160 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Processing…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Confirm & Pay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main CartPage ─────────────────────────────────────────────────────────── */
export default function CartPage() {
  const { user }                          = useAuth();
  const { cart, fetchCart }               = useCart();
  const { openPayment }                   = useRazorpay();
  const nav                               = useNavigate();
  const [updating,         setUpdating]   = useState(null);
  const [removing,         setRemoving]   = useState(null);
  const [showModal,        setShowModal]  = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeFromCart(productId);
      await fetchCart();
      toast.success("Item removed");
    } catch (err) { toast.error(err.message); }
    finally { setRemoving(null); }
  };

  const handleQuantity = async (productId, qty) => {
    setUpdating(productId);
    try {
      await updateCartItem(productId, qty);
      await fetchCart();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(null); }
  };

  const handleCheckout = async (shippingAddress) => {
    setCheckoutLoading(true);
    try {
      const { data } = await createOrder({ shippingAddress });
      const { razorpayOrder, razorpayKeyId, order } = data.data;

      openPayment({
        razorpayOrder,
        keyId: razorpayKeyId,
        user,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              orderId:            order.id,
              razorpayOrderId:    response.razorpay_order_id,
              razorpayPaymentId:  response.razorpay_payment_id,
              razorpaySignature:  response.razorpay_signature,
            });
            toast.success("Order placed successfully! 🎉");
            await fetchCart();
            nav("/orders");
          } catch (err) { toast.error(err.message); }
          finally { setCheckoutLoading(false); }
        },
        onFailure: (err) => {
          toast.error(err.message || "Payment failed");
          setCheckoutLoading(false);
        },
      });
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
      setCheckoutLoading(false);
    }
  };

  const items    = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 499 ? 0 : 49;
  const total    = subtotal + shipping;
  const savings  = items.reduce((acc, item) => {
    const p = item.productId;
    if (!p) return acc;
    const mrp   = p.mrp || p.price;
    const price = item.currentPrice || p.price;
    return acc + (mrp - price) * item.quantity;
  }, 0);

  /* ── Empty State ── */
  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.emptySub}>Looks like you haven't added anything yet. Start shopping to fill it up!</p>
            <div className={styles.emptyActions}>
              <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
              <Link to="/" className="btn btn-ghost">Go to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Shopping Cart</h1>
            <p className={styles.pageSubtitle}>{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
          </div>
          <Link to="/products" className={styles.continueShopping}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Continue Shopping
          </Link>
        </div>

        <div className={styles.layout}>

          {/* ── Items Column ── */}
          <div className={styles.itemsCol}>
            {items.map((item) => {
              const p = item.productId;
              if (!p) return null;
              const price      = item.currentPrice || p.price;
              const mrp        = p.mrp || p.price;
              const discount   = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
              const isUpdating = updating === p._id;
              const isRemoving = removing === p._id;

              return (
                <div key={p._id} className={`${styles.cartItem} ${isRemoving ? styles.removing : ""}`}>

                  {/* Image */}
                  <Link to={`/products/${p._id}`} className={styles.itemImageWrap}>
                    <img
                      src={p.images?.[0] || "/images/brand/logo.png"}
                      alt={p.name}
                      className={styles.itemImage}
                    />
                    {discount > 0 && (
                      <span className={styles.itemDiscount}>-{discount}%</span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className={styles.itemInfo}>
                    {p.brand && <p className={styles.itemBrand}>{p.brand}</p>}
                    <Link to={`/products/${p._id}`} className={styles.itemName}>{p.name}</Link>
                    <div className={styles.itemPriceRow}>
                      <span className={styles.itemPrice}>₹{price.toLocaleString("en-IN")}</span>
                      {mrp > price && (
                        <span className={styles.itemMrp}>₹{mrp.toLocaleString("en-IN")}</span>
                      )}
                      {discount > 0 && (
                        <span className={styles.itemSaving}>{discount}% off</span>
                      )}
                    </div>
                    {p.stock <= 5 && p.stock > 0 && (
                      <p className={styles.itemStockWarn}>Only {p.stock} left in stock</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.itemActions}>
                    <div className={styles.itemTotal}>
                      ₹{(price * item.quantity).toLocaleString("en-IN")}
                    </div>

                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => item.quantity > 1 && handleQuantity(p._id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdating}
                        aria-label="Decrease quantity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                      <span className={styles.qty}>
                        {isUpdating
                          ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          : item.quantity}
                      </span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => item.quantity < 10 && handleQuantity(p._id, item.quantity + 1)}
                        disabled={item.quantity >= 10 || isUpdating}
                        aria-label="Increase quantity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(p._id)}
                      disabled={isRemoving}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      {isRemoving ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Summary Column ── */}
          <div className={styles.summaryCol}>
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery Charges</span>
                  {shipping === 0 ? (
                    <span className={styles.freeLabel}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      FREE
                    </span>
                  ) : (
                    <span>₹{shipping}</span>
                  )}
                </div>
                {shipping > 0 && (
                  <p className={styles.freeDeliveryHint}>
                    Add ₹{(499 - subtotal).toLocaleString("en-IN")} more for free delivery
                  </p>
                )}
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total Amount</span>
                <span className={styles.totalAmount}>₹{total.toLocaleString("en-IN")}</span>
              </div>

              {savings > 0 && (
                <div className={styles.savingsBox}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  You're saving ₹{savings.toLocaleString("en-IN")} on this order!
                </div>
              )}

              <button
                className={styles.checkoutBtn}
                onClick={() => setShowModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Proceed to Checkout
              </button>

              <div className={styles.secureNote}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Secured by Razorpay — Safe & Encrypted
              </div>
            </div>

            {/* Delivery info */}
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="m16 8 5 3-5 3V8z"/>
                  <path d="M1 21h15"/><path d="M16 21h6"/>
                </svg>
                <span>Estimated delivery: <strong>3–5 business days</strong></span>
              </div>
              <div className={styles.deliveryItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                </svg>
                <span>Easy returns within <strong>14 days</strong></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Address Modal */}
      {showModal && (
        <AddressModal
          onConfirm={handleCheckout}
          onClose={() => setShowModal(false)}
          loading={checkoutLoading}
          user={user}
        />
      )}
    </div>
  );
}