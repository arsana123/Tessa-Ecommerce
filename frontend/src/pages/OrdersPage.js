import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api";
import styles from "./OrdersPage.module.css";

const STATUS_META = {
  created:    { label: "Created",    color: "#aaaaaa", bg: "#f3f4f6", icon: "🕐" },
  confirmed:  { label: "Confirmed",  color: "#1d4ed8", bg: "#dbeafe", icon: "✅" },
  processing: { label: "Processing", color: "#c2410c", bg: "#fff7ed", icon: "⚙️" },
  shipped:    { label: "Shipped",    color: "#7c3aed", bg: "#f5f3ff", icon: "🚚" },
  delivered:  { label: "Delivered",  color: "#16a34a", bg: "#f0fdf4", icon: "📦" },
  cancelled:  { label: "Cancelled",  color: "#dc2626", bg: "#fef2f2", icon: "❌" },
};

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];

function OrderStatusTracker({ status }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (currentIdx === -1 || status === "cancelled" || status === "created") return null;

  return (
    <div className={styles.tracker}>
      {STATUS_STEPS.map((s, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className={styles.trackerStep}>
            <div className={`${styles.trackerDot} ${done ? styles.trackerDotDone : ""} ${active ? styles.trackerDotActive : ""}`}>
              {done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className={`${styles.trackerLabel} ${done ? styles.trackerLabelDone : ""}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`${styles.trackerLine} ${i < currentIdx ? styles.trackerLineDone : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState({ pages: 1, total: 0 });
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyOrders({ page, limit: 10 })
      .then(({ data }) => {
        setOrders(data.data || []);
        setPagination({ pages: data.pagination?.pages || 1, total: data.pagination?.total || 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Orders</h1>
          </div>
          <div className={styles.skeletonList}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`${styles.skeleton} ${styles.skeletonTop}`} />
                <div className={`${styles.skeleton} ${styles.skeletonBody}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Orders</h1>
            <p className={styles.pageSubtitle}>
              {pagination.total} total order{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
          <Link to="/products" className={styles.shopMoreBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Shop More
          </Link>
        </div>

        {/* ── Empty state ── */}
        {orders.length === 0 ? (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No orders yet</h2>
            <p className={styles.emptySub}>Your orders will appear here after you make a purchase.</p>
            <Link to="/" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const meta       = STATUS_META[order.orderStatus] || STATUS_META.created;
              const isExpanded = expandedOrder === order._id;

              return (
                <div key={order._id} className={styles.orderCard}>

                  {/* Card Top */}
                  <div className={styles.orderTop}>
                    <div className={styles.orderMeta}>
                      <div className={styles.orderIdRow}>
                        <span className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                        {order.isFlashOrder && (
                          <span className={styles.flashTag}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            Flash
                          </span>
                        )}
                      </div>
                      <p className={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className={styles.orderRight}>
                      <div
                        className={styles.statusBadge}
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        <span>{meta.icon}</span>
                        {meta.label}
                      </div>
                      <p className={styles.orderTotal}>
                        ₹{order.totalPrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Status Tracker */}
                  <OrderStatusTracker status={order.orderStatus} />

                  {/* Items Preview */}
                  <div className={styles.itemsPreview}>
                    {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, idx) => (
                      <div key={idx} className={styles.previewItem}>
                        <img
                          src={item.image || "/images/brand/logo.png"}
                          alt={item.name}
                          className={styles.previewImg}
                        />
                        <div className={styles.previewInfo}>
                          <p className={styles.previewName}>{item.name}</p>
                          <p className={styles.previewMeta}>
                            Qty: {item.quantity} · ₹{item.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className={styles.previewTotal}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}

                    {order.items.length > 2 && !isExpanded && (
                      <button className={styles.showMoreBtn} onClick={() => setExpandedOrder(order._id)}>
                        +{order.items.length - 2} more item{order.items.length - 2 > 1 ? "s" : ""}
                      </button>
                    )}
                    {isExpanded && order.items.length > 2 && (
                      <button className={styles.showMoreBtn} onClick={() => setExpandedOrder(null)}>
                        Show less
                      </button>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className={styles.orderFooter}>
                    <div className={styles.paymentStatus}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Payment:{" "}
                      <span className={order.payment?.status === "paid" ? styles.paid : styles.pending}>
                        {order.payment?.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <div className={styles.footerRight}>
                      <span className={styles.footerTotal}>
                        Total: <strong>₹{order.totalPrice.toLocaleString("en-IN")}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >← Previous</button>
            <span className={styles.pageInfo}>Page {page} of {pagination.pages}</span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
            >Next →</button>
          </div>
        )}

      </div>
    </div>
  );
}