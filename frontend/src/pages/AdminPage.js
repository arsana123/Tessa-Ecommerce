import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  adminGetProducts, createProduct, updateProduct, deleteProduct,
  setFlashSale, cancelFlashSale, adminGetOrders, updateOrderStatus,
} from "../api";
import styles from "./AdminPage.module.css";

const TABS = ["Products", "Add Product", "Orders"];
const CATEGORIES = ["Gowns", "Tops", "Co-ords", "Sarees", "Fashion", "General"];
const ORDER_STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];

const toLocalInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FlashModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    startTime: toLocalInput(product.flashSale?.startTime || ""),
    endTime: toLocalInput(product.flashSale?.endTime || ""),
    salePrice: product.flashSale?.salePrice || "",
    flashStock: product.flashSale?.flashStock || "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.startTime || !form.endTime || !form.salePrice || !form.flashStock) {
      toast.error("All fields are required"); return;
    }
    if (Number(form.salePrice) >= product.price) {
      toast.error("Flash price must be less than regular price"); return;
    }
    setLoading(true);
    try {
      await setFlashSale(product._id, {
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        salePrice: Number(form.salePrice),
        flashStock: Number(form.flashStock),
      });
      toast.success("Flash sale configured!");
      onSaved();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Configure Flash Sale</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.productLabel}>{product.name}</p>
          <p className={styles.regularPrice}>Regular price: ₹{product.price.toLocaleString("en-IN")}</p>
          <div className={styles.formGrid}>
            {[
              { label: "Start Time", key: "startTime", type: "datetime-local" },
              { label: "End Time", key: "endTime", type: "datetime-local" },
              { label: "Flash Price (₹)", key: "salePrice", type: "number" },
              { label: "Flash Stock (units)", key: "flashStock", type: "number" },
            ].map(({ label, key, type }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type} value={form[key]} onChange={set(key)} required />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save Flash Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState("Products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [flashTarget, setFlashTarget] = useState(null);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ pages: 1, total: 0 });
  const [savingProduct, setSavingProduct] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "", price: "", mrp: "", stock: "", category: "Gowns",
    brand: "", description: "", isFeatured: false,
    images: "",
  });

  const loadProducts = useCallback(async () => {
    setLoadingProds(true);
    try {
      const { data } = await adminGetProducts({ page: 1, limit: 50 });
      setProducts(data.data || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoadingProds(false); }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await adminGetOrders({ page: orderPage, limit: 20 });
      setOrders(data.data || []);
      setOrderPagination({ pages: data.pagination?.pages || 1, total: data.pagination?.total || 0 });
    } catch (err) { toast.error(err.message); }
    finally { setLoadingOrders(false); }
  }, [orderPage]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (tab === "Orders") loadOrders(); }, [tab, loadOrders]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price),
        mrp: newProduct.mrp ? Number(newProduct.mrp) : undefined,
        stock: Number(newProduct.stock),
        images: newProduct.images ? newProduct.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      await createProduct(payload);
      toast.success("Product created!");
      setNewProduct({ name: "", price: "", mrp: "", stock: "", category: "Gowns", brand: "", description: "", isFeatured: false, images: "" });
      loadProducts();
      setTab("Products");
    } catch (err) { toast.error(err.message); }
    finally { setSavingProduct(false); }
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product._id, { isActive: !product.isActive });
      toast.success(product.isActive ? "Product deactivated" : "Product activated");
      loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await updateProduct(product._id, { isFeatured: !product.isFeatured });
      toast.success(product.isFeatured ? "Removed from featured" : "Marked as featured");
      loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const handleCancelFlash = async (productId) => {
    if (!window.confirm("Cancel this flash sale?")) return;
    try {
      await cancelFlashSale(productId);
      toast.success("Flash sale cancelled");
      loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success("Status updated");
      loadOrders();
    } catch (err) { toast.error(err.message); }
  };

  const setField = (k) => (e) =>
    setNewProduct((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const activeProducts = products.filter((p) => p.isActive).length;
  const flashProducts  = products.filter((p) => p.flashSale?.isActive).length;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Admin Dashboard</h1>
            <p className={styles.pageSub}>Products · Flash Sales · Orders</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          {[
            { label: "Total Products",  value: products.length },
            { label: "Active Products", value: activeProducts  },
            { label: "Flash Sales",     value: flashProducts   },
            { label: "Total Orders",    value: orderPagination.total || "—" },
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Products Tab ─────────────────────────────────────────────────── */}
        {tab === "Products" && (
          <div className={styles.tabContent}>
            {loadingProds ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : (
              <div className={styles.table}>
                <div className={styles.tableHead}>
                  <span>Product</span>
                  <span>Price</span>
                  <span>Stock</span>
                  <span>Status</span>
                  <span>Flash Sale</span>
                  <span>Actions</span>
                </div>
                {products.map((p) => {
                  const now = new Date();
                  const flashLive = p.flashSale?.isActive &&
                    new Date(p.flashSale.startTime) <= now &&
                    new Date(p.flashSale.endTime) >= now;

                  return (
                    <div key={p._id} className={styles.tableRow}>
                      <div className={styles.productCell}>
                        <img
                          src={p.images?.[0] || "/images/brand/logo.png"}
                          alt={p.name}
                          className={styles.productThumb}
                        />
                        <div style={{ minWidth: 0 }}>
                          <p className={styles.productName}>{p.name}</p>
                          <p className={styles.productCategory}>{p.category} · {p.brand}</p>
                        </div>
                      </div>

                      <span className={styles.cell}>₹{p.price.toLocaleString("en-IN")}</span>
                      <span className={styles.cell}>{p.stock}</span>

                      <span className={styles.cell}>
                        <span className={`${styles.pill} ${p.isActive ? styles.pillGreen : styles.pillGray}`}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>

                      <span className={styles.cell}>
                        {p.flashSale?.isActive ? (
                          <div className={styles.flashInfo}>
                            <span className={`${styles.pill} ${flashLive ? styles.pillRed : styles.pillOrange}`}>
                              {flashLive ? "Live" : "Scheduled"}
                            </span>
                            <span className={styles.flashPrice}>₹{p.flashSale.salePrice}</span>
                          </div>
                        ) : (
                          <span className={styles.noFlash}>—</span>
                        )}
                      </span>

                      <div className={styles.actionCell}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => setFlashTarget(p)}
                          title="Set Flash Sale"
                        >
                          Flash
                        </button>
                        {p.flashSale?.isActive && (
                          <button
                            className={styles.cancelFlashBtn}
                            onClick={() => handleCancelFlash(p._id)}
                            title="Cancel Flash Sale"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          className={p.isFeatured ? styles.featuredActiveBtn : styles.featuredBtn}
                          onClick={() => handleToggleFeatured(p)}
                          title={p.isFeatured ? "Remove from featured" : "Mark featured"}
                        >
                          {p.isFeatured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          className={p.isActive ? styles.deactivateBtn : styles.activateBtn}
                          onClick={() => handleToggleActive(p)}
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Add Product Tab ───────────────────────────────────────────────── */}
        {tab === "Add Product" && (
          <div className={styles.tabContent}>
            <div className={styles.formCard}>
              <h3 className={styles.formCardTitle}>Create New Product</h3>
              <form onSubmit={handleCreateProduct} className={styles.productForm}>
                <div className={styles.formGrid2}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" value={newProduct.name} onChange={setField("name")} placeholder="Product name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={newProduct.brand} onChange={setField("brand")} placeholder="Brand name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-input" value={newProduct.category} onChange={setField("category")}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input className="form-input" type="number" value={newProduct.price} onChange={setField("price")} placeholder="0.00" min="0" step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MRP (₹)</label>
                    <input className="form-input" type="number" value={newProduct.mrp} onChange={setField("mrp")} placeholder="Original price (optional)" min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock *</label>
                    <input className="form-input" type="number" value={newProduct.stock} onChange={setField("stock")} placeholder="Available units" min="0" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={newProduct.description} onChange={setField("description")} placeholder="Product description" rows={3} style={{ resize: "vertical" }} />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">Image URLs (comma-separated)</label>
                  <input className="form-input" value={newProduct.images} onChange={setField("images")} placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
                </div>
                <div className={styles.checkRow}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={newProduct.isFeatured} onChange={setField("isFeatured")} className={styles.checkbox} />
                    Mark as Featured Product
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className="btn btn-ghost" onClick={() => setTab("Products")}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingProduct}>
                    {savingProduct ? "Creating…" : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Orders Tab ────────────────────────────────────────────────────── */}
        {tab === "Orders" && (
          <div className={styles.tabContent}>
            {loadingOrders ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : (
              <>
                <p className={styles.orderCount}>{orderPagination.total} total orders</p>
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.ordersHead}`}>
                    <span>Order ID</span>
                    <span>Customer</span>
                    <span>Items</span>
                    <span>Total</span>
                    <span>Payment</span>
                    <span>Type</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {orders.map((o) => (
                    <div key={o._id} className={`${styles.tableRow} ${styles.ordersRow}`}>
                      <span className={styles.orderId}>#{o._id.slice(-8).toUpperCase()}</span>
                      <div className={styles.cell}>
                        <p className={styles.customerPhone}>{o.userId?.phone || "—"}</p>
                        <p className={styles.customerName}>{o.userId?.name || ""}</p>
                      </div>
                      <span className={styles.cell}>{o.items?.length || 0} item(s)</span>
                      <span className={styles.cell}>₹{o.totalPrice?.toLocaleString("en-IN")}</span>
                      <span className={styles.cell}>
                        <span className={`${styles.pill} ${o.payment?.status === "paid" ? styles.pillGreen : styles.pillOrange}`}>
                          {o.payment?.status || "—"}
                        </span>
                      </span>
                      <span className={styles.cell}>
                        {o.isFlashOrder ? (
                          <span className={`${styles.pill} ${styles.pillRed}`}>Flash</span>
                        ) : (
                          <span className={`${styles.pill} ${styles.pillGray}`}>Regular</span>
                        )}
                      </span>
                      <span className={styles.cell} style={{ fontSize: 12 }}>
                        {new Date(o.createdAt).toLocaleDateString("en-IN")}
                      </span>
                      <div className={styles.cell}>
                        <select
                          className={styles.statusSelect}
                          value={o.orderStatus}
                          onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {orderPagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button className="btn btn-outline btn-sm" onClick={() => setOrderPage((p) => p - 1)} disabled={orderPage <= 1}>← Prev</button>
                    <span className={styles.pageInfo}>Page {orderPage} of {orderPagination.pages}</span>
                    <button className="btn btn-outline btn-sm" onClick={() => setOrderPage((p) => p + 1)} disabled={orderPage >= orderPagination.pages}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Flash Sale Modal */}
      {flashTarget && (
        <FlashModal
          product={flashTarget}
          onClose={() => setFlashTarget(null)}
          onSaved={loadProducts}
        />
      )}
    </div>
  );
}