import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api";
import ProductCard from "../components/common/ProductCard";
import styles from "./ProductsPage.module.css";

const CATEGORIES = ["Gowns", "Tops", "Co-ords", "Sarees"];
const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest First" },
  { value: "price",      label: "Price: Low to High" },
  { value: "-price",     label: "Price: High to Low" },
  { value: "-sold",      label: "Most Popular" },
];
const CAT_ICONS = {
  "Gowns":   "✦",
  "Tops":    "✦",
  "Co-ords": "✦",
  "Sarees":  "✦",
};

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImg} />
      <div style={{ padding: 14 }}>
        <div className={styles.skeletonLine} style={{ width: "60%", height: 10, marginBottom: 8 }} />
        <div className={styles.skeletonLine} style={{ width: "90%", height: 13, marginBottom: 6 }} />
        <div className={styles.skeletonLine} style={{ width: "70%", height: 13, marginBottom: 12 }} />
        <div className={styles.skeletonLine} style={{ width: "45%", height: 18 }} />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading,    setLoading]    = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const search   = searchParams.get("search")   || "";
  const sort     = searchParams.get("sort")     || "-createdAt";
  const page     = parseInt(searchParams.get("page") || "1");
  const flash    = searchParams.get("flash")    || "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (category) params.category = category;
      if (search)   params.search   = search;
      if (flash)    params.flash    = true;
      const { data } = await getProducts(params);
      setProducts(data.data || []);
      setPagination(data.pagination || { total: 0, pages: 1, page: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page, flash]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    setSearchParams(next);
    setSidebarOpen(false);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span>Home</span>
          <span className={styles.breadcrumbSep}>›</span>
          <span>{category || search ? (category || `Search: "${search}"`) : "All Products"}</span>
        </div>

        <div className={styles.layout}>

          {/* ── Sidebar ── */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Filters</h3>
              <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.filterSection}>
              <h4 className={styles.filterTitle}>Categories</h4>
              <div className={styles.filterList}>
                <button
                  className={`${styles.filterItem} ${!category && !flash ? styles.filterActive : ""}`}
                  onClick={() => { setParam("category", ""); setParam("flash", ""); }}
                >
                  <span className={styles.filterIcon}>🛍️</span>
                  All Categories
                  {!category && !flash && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>

                <button
                  className={`${styles.filterItem} ${flash ? styles.filterActive : ""}`}
                  onClick={() => setParam("flash", "true")}
                >
                  <span className={styles.filterIcon}>⚡</span>
                  Flash Deals
                  {flash && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>

                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`${styles.filterItem} ${category === c ? styles.filterActive : ""}`}
                    onClick={() => setParam("category", c)}
                  >
                    <span className={styles.filterIcon}>{CAT_ICONS[c]}</span>
                    {c}
                    {category === c && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
          )}

          {/* ── Main ── */}
          <main className={styles.main}>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <div className={styles.topLeft}>
                <button className={styles.filterToggle} onClick={() => setSidebarOpen(true)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="12" y1="18" x2="12" y2="18"/>
                  </svg>
                  Filters
                </button>

                {search && (
                  <div className={styles.searchTag}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    "{search}"
                    <button onClick={() => setParam("search", "")}>×</button>
                  </div>
                )}
                {category && (
                  <div className={styles.searchTag}>
                    {CAT_ICONS[category]} {category}
                    <button onClick={() => setParam("category", "")}>×</button>
                  </div>
                )}
                {flash && (
                  <div className={`${styles.searchTag} ${styles.flashTag}`}>
                    ⚡ Flash Deals
                    <button onClick={() => setParam("flash", "")}>×</button>
                  </div>
                )}
              </div>

              <div className={styles.topRight}>
                <p className={styles.resultCount}>
                  {loading ? "Loading…" : `${pagination.total} products`}
                </p>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className={styles.productGrid}>
                {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
                <button className="btn btn-primary" onClick={() => setSearchParams({})}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={styles.productGrid}>
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`btn btn-outline btn-sm ${styles.pageBtn}`}
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>

                <div className={styles.pageNumbers}>
                  {[...Array(pagination.pages)].map((_, idx) => {
                    const p = idx + 1;
                    if (p === 1 || p === pagination.pages || Math.abs(p - page) <= 1) {
                      return (
                        <button
                          key={p}
                          className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      );
                    } else if (Math.abs(p - page) === 2) {
                      return <span key={p} className={styles.pageEllipsis}>…</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  className={`btn btn-outline btn-sm ${styles.pageBtn}`}
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}