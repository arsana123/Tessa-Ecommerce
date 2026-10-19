import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getProduct, addToCart, createFlashOrder, verifyFlashPayment } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCountdown } from "../hooks/useCountdown";
import { useRazorpay } from "../hooks/useRazorpay";
import styles from "./ProductDetailPage.module.css";

const pct = (a, b) => b && b > a ? Math.round(((b - a) / b) * 100) : 0;

/* ── Flash Address Form ─────────────────────────────────────────────────── */
const AddressForm = ({ onSubmit, loading, onCancel }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "",
    line1: "", city: "", state: "", pincode: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className={styles.addressForm}>
      <div className={styles.addressHeader}>
        <div className={styles.addressIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <h4 className={styles.addressTitle}>Shipping Address</h4>
      </div>

      <div className={styles.formRow}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={set("name")} placeholder="Full name" required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={set("phone")} placeholder="10-digit phone" maxLength={10} required />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address Line 1</label>
        <input className="form-input" value={form.line1} onChange={set("line1")} placeholder="House/flat no, street, area" required />
      </div>
      <div className={styles.formRow3}>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city} onChange={set("city")} placeholder="City" required />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={form.state} onChange={set("state")} placeholder="State" required />
        </div>
        <div className="form-group">
          <label className="form-label">Pincode</label>
          <input className="form-input" value={form.pincode} onChange={set("pincode")} placeholder="6-digit" maxLength={6} required />
        </div>
      </div>
      <div className={styles.addressActions}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button
          className={styles.buyNowBtn}
          onClick={() => onSubmit(form)}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Proceed to Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { id } = useParams();
  const nav    = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { fetchCart }        = useCart();
  const { openPayment }      = useRazorpay();

  const [product,         setProduct]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [addingCart,      setAddingCart]      = useState(false);
  const [buyNowLoading,   setBuyNowLoading]   = useState(false);
  const [buyLoading,      setBuyLoading]      = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [activeImage,     setActiveImage]     = useState(0);
  const [addedToCart,     setAddedToCart]     = useState(false);

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const flash      = product?.flashSale;
  const now        = new Date();
  const isFlashLive = flash?.isActive && new Date(flash.startTime) <= now && new Date(flash.endTime) >= now;
  const { parts, isExpired } = useCountdown(isFlashLive ? flash?.endTime : null);
  const redisStock = product?.redisFlashStock;
  const isSoldOut  = isFlashLive && redisStock !== null && redisStock <= 0;
  const discount   = isFlashLive ? pct(flash?.salePrice, product?.price) : pct(product?.price, product?.mrp);
  const stockPct   = flash?.flashStock && redisStock != null
    ? Math.max(5, Math.min(100, (redisStock / flash.flashStock) * 100))
    : 100;

  const handleAddToCart = async () => {
    if (!isLoggedIn) { nav("/login"); return; }
    setAddingCart(true);
    try {
      await addToCart({ productId: id, quantity: 1 });
      await fetchCart();
      setAddedToCart(true);
      toast.success("Added to cart!");
      setTimeout(() => setAddedToCart(false), 2500);
    } catch (err) { toast.error(err.message); }
    finally { setAddingCart(false); }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) { nav("/login"); return; }
    if (isFlashLive && !isExpired) { setShowAddressForm(true); return; }
    setBuyNowLoading(true);
    try {
      await addToCart({ productId: id, quantity: 1 });
      await fetchCart();
      nav("/cart");
    } catch (err) {
      toast.error(err.message);
      setBuyNowLoading(false);
    }
  };

  const handleFlashBuy = async (shippingAddress) => {
    if (!isLoggedIn) { nav("/login"); return; }
    setBuyLoading(true);
    try {
      const { data } = await createFlashOrder({ productId: id, shippingAddress });
      const { razorpayOrder, razorpayKeyId, order } = data.data;

      openPayment({
        razorpayOrder,
        keyId: razorpayKeyId,
        user,
        onSuccess: async (response) => {
          try {
            await verifyFlashPayment({
              orderId:           order.id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Order confirmed! Congratulations! 🎉");
            nav("/orders");
          } catch (err) { toast.error(err.message); }
          finally { setBuyLoading(false); }
        },
        onFailure: (err) => {
          toast.error(err.message || "Payment failed");
          setBuyLoading(false);
        },
      });
      setShowAddressForm(false);
    } catch (err) {
      toast.error(err.message);
      setBuyLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonLine} style={{ width: "40%", height: 14 }} />
              <div className={styles.skeletonLine} style={{ width: "90%", height: 28 }} />
              <div className={styles.skeletonLine} style={{ width: "70%", height: 22 }} />
              <div className={styles.skeletonLine} style={{ width: "55%", height: 18 }} />
              <div className={styles.skeletonLine} style={{ width: "100%", height: 44, marginTop: 16 }} />
              <div className={styles.skeletonLine} style={{ width: "100%", height: 44 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Product not found</h3>
        <p>This product may have been removed.</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const images     = product.images?.length ? product.images : ["/images/brand/logo.png"];
  const isOutOfStock = product.stock === 0;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>Home</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link to="/products" className={styles.breadcrumbLink}>Products</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <Link to={`/products?category=${product.category}`} className={styles.breadcrumbLink}>{product.category}</Link>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </div>

        <div className={styles.layout}>

          {/* ── Image Section ── */}
          <div className={styles.imageSection}>
            <div className={styles.mainImageWrap}>
              {isFlashLive && !isExpired && (
                <div className={styles.liveChip}>
                  <span className={styles.liveDot} />
                  LIVE SALE
                </div>
              )}
              {discount > 0 && (
                <div className={styles.discountChip}>-{discount}%</div>
              )}
              <img src={images[activeImage]} alt={product.name} className={styles.mainImage} />
              {images.length > 1 && (
                <>
                  <button
                    className={`${styles.imgArrow} ${styles.imgArrowLeft}`}
                    onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <button
                    className={`${styles.imgArrow} ${styles.imgArrowRight}`}
                    onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbRow}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeImage === i ? styles.thumbActive : ""}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}

            <div className={styles.trustRow}>
              {[["🚚", "Free Delivery"], ["↩️", "14-Day Return"], ["🔒", "Secure Pay"]].map(([icon, label]) => (
                <div key={label} className={styles.trustItem}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Info Panel ── */}
          <div className={styles.infoPanel}>
            <div className={styles.badgeRow}>
              {product.brand && <span className={styles.brandBadge}>{product.brand}</span>}
              <span className={styles.catBadge}>{product.category}</span>
              {product.isFeatured && (
                <span className={styles.featuredBadge}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                  Featured
                </span>
              )}
            </div>

            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= 4 ? "#f59e0b" : "#e8e8e8"}>
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span className={styles.ratingText}>4.2 · {product.sold || 0} sold</span>
            </div>

            <div className={styles.divider} />

            {/* Flash Sale Box */}
            {isFlashLive && !isExpired ? (
              <div className={styles.flashBox}>
                <div className={styles.flashBoxTop}>
                  <div className={styles.flashBoxLabel}>
                    <span className={styles.flashPulse} />
                    Flash Sale — Ends in
                  </div>
                  {parts && (
                    <div className={styles.timerBlocks}>
                      {[["h", "HRS"], ["m", "MIN"], ["s", "SEC"]].map(([k, lbl]) => (
                        <div key={k} className={styles.timerBlock}>
                          <span className={styles.timerDigit}>{String(parts[k]).padStart(2, "0")}</span>
                          <span className={styles.timerLabel}>{lbl}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.flashPriceGroup}>
                  <span className={styles.flashPrice}>₹{flash.salePrice.toLocaleString("en-IN")}</span>
                  <span className={styles.origPrice}>₹{product.price.toLocaleString("en-IN")}</span>
                  <span className={styles.savingsBadge}>{discount}% OFF</span>
                </div>

                {redisStock !== null && (
                  <div className={styles.stockSection}>
                    <div className={styles.stockBarWrap}>
                      <div className={styles.stockBar}>
                        <div className={styles.stockBarFill} style={{ width: `${stockPct}%` }} />
                      </div>
                      <span className={styles.stockText}>
                        {isSoldOut
                          ? "🔴 Sold Out"
                          : redisStock <= 5
                          ? `🔥 Only ${redisStock} left!`
                          : `${redisStock} of ${flash.flashStock} remaining`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.priceGroup}>
                <span className={styles.price}>₹{(product.price || 0).toLocaleString("en-IN")}</span>
                {product.mrp > product.price && (
                  <>
                    <span className={styles.mrpPrice}>₹{product.mrp.toLocaleString("en-IN")}</span>
                    <span className={styles.savingsBadge}>{discount}% OFF</span>
                  </>
                )}
              </div>
            )}

            {/* Upcoming flash */}
            {flash?.isActive && !isFlashLive && new Date(flash.startTime) > now && (
              <div className={styles.upcomingBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Flash sale starts {new Date(flash.startTime).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}

            <div className={styles.divider} />

            {product.description && (
              <div className={styles.descSection}>
                <h3 className={styles.descTitle}>About this product</h3>
                <p className={styles.desc}>{product.description}</p>
              </div>
            )}

            <div className={styles.stockStatus}>
              {isOutOfStock ? (
                <span className={styles.outOfStock}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  Out of Stock
                </span>
              ) : (
                <span className={styles.inStock}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  In Stock · {product.stock} units available
                </span>
              )}
            </div>

            {!showAddressForm ? (
              <div className={styles.actionButtons}>
                <button
                  className={styles.buyNowBtn}
                  onClick={handleBuyNow}
                  disabled={isOutOfStock || (isFlashLive && isSoldOut) || buyNowLoading}
                >
                  {buyNowLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing…</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                      {isFlashLive && !isExpired ? "Buy Now (Flash)" : "Buy Now"}
                    </>
                  )}
                </button>

                <button
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingCart}
                >
                  {addingCart ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Adding…</>
                  ) : addedToCart ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Added!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            ) : (
              <AddressForm
                onSubmit={handleFlashBuy}
                loading={buyLoading}
                onCancel={() => setShowAddressForm(false)}
              />
            )}

            {addedToCart && (
              <Link to="/cart" className={styles.viewCartLink}>View Cart →</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}