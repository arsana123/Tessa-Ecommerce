import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import styles from "./Navbar.module.css";

/* ── Tessa logo (monogram + wordmark) ─────────────────────────────────── */
function TessaLogo() {
  return (
    <span className={styles.logoLockup}>
      <img src="/images/brand/logo.png" alt="" className={styles.logoImg} width="44" height="44" />
      <span className={styles.logoWord}>Tessa</span>
    </span>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin, isLoggedIn } = useAuth();
  const { cart } = useCart();
  const nav = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      nav(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = () => { logout(); setMenuOpen(false); nav("/"); };
  const itemCount = cart?.itemCount || 0;

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>

      {/* ── Top announcement bar ──────────────────────────────────────── */}
      <div className={styles.announcementBar}>
        <span>Free delivery on orders ₹499+ &nbsp;·&nbsp; Same dreams, new chapters &nbsp;·&nbsp; <Link to="/products?flash=true" className={styles.annLink}>Shop the Flash Edit</Link></span>
      </div>

      {/* ── Main nav row ──────────────────────────────────────────────── */}
      <div className={styles.mainRow}>
        <div className={styles.inner}>

          {/* Mobile hamburger */}
          <button className={styles.hamburger} aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>

          {/* Logo */}
          <Link to="/" className={styles.logo} aria-label="Tessa home">
            <TessaLogo />
          </Link>

          {/* Centre nav links (desktop) */}
          <div className={styles.navLinks}>
            {[
              { label: "Flash Edit", to: "/products?flash=true" },
              { label: "All Pieces", to: "/products" },
              { label: "Gowns", to: "/products?category=Gowns" },
              { label: "Tops", to: "/products?category=Tops" },
              { label: "Co-ords", to: "/products?category=Co-ords" },
              { label: "Sarees", to: "/products?category=Sarees" },
            ].map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`${styles.navLink} ${
                  location.pathname + location.search === l.to ? styles.navLinkActive : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Search – desktop */}
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
              />
            </form>

            {/* Mobile search */}
            <button className={styles.iconBtn} onClick={() => setMobileSearchOpen(!mobileSearchOpen)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            {/* Account */}
            {isLoggedIn ? (
              <div className={styles.userMenu} ref={menuRef}>
                <button className={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
                  <span className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                  <span className={styles.userName}>{user?.name?.split(" ")[0] || "Account"}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "none", opacity: 0.4 }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropHeader}>
                      <span className={styles.dropAvatar}>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                      <div>
                        <p className={styles.dropName}>{user?.name || "User"}</p>
                        <p className={styles.dropEmail}>{user?.email || user?.phone || ""}</p>
                      </div>
                    </div>
                    <div className={styles.dropDivider} />
                    <Link to="/orders" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <div className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={styles.loginBtn}>Sign In</Link>
            )}

            {/* Wishlist icon */}
            {/* <button className={styles.iconBtn} aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button> */}

            {/* Cart */}
            <Link to="/cart" className={styles.cartBtn} aria-label="Cart">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className={styles.cartBadge}>{itemCount > 99 ? "99+" : itemCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <form onSubmit={handleSearch} className={styles.mobileSearchForm}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "#999", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.mobileSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              autoFocus
            />
          </form>
        </div>
      )}
    </nav>
  );
}