import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { adminLogin, register, loginUser } from "../api";
import { useAuth } from "../context/AuthContext";
import styles from "./LoginPage.module.css";

/*
  SLIDER IMAGES — replace these URLs with your own image paths.
  Place your images in /public/images/ and reference them as "/images/slide1.jpg"
  or import them directly: import slide1 from "../assets/slide1.jpg"
*/
const SLIDES = [
  {
    img: "/images/products/garnet-velvet-gown.jpg",
    label: "Evening Edit",
    headline: "Same dreams,\nnew chapters.",
    sub: "Gowns cut to move with you, in colours that hold the light.",
    cta: "Shop Gowns",
    ctaPath: "/products?category=Gowns",
  },
  {
    img: "/images/products/porcelain-bloom-gown.jpg",
    label: "Porcelain Bloom",
    headline: "Embroidered\nby the hour.",
    sub: "Blue-and-white florals, pearls and tulle, finished by hand.",
    cta: "Explore Now",
    ctaPath: "/products",
  },
  {
    img: "/images/products/claret-tweed-set.jpg",
    label: "Tailored Sets",
    headline: "Quiet luxury,\nevery day.",
    sub: "Tweed jackets and wide-leg trousers for a capsule wardrobe.",
    cta: "Shop Co-ords",
    ctaPath: "/products?category=Co-ords",
  },
];

/* ── Image Slider Component ─────────────────────────────────────────────── */
function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), []);

  /* auto-advance every 5 s unless paused */
  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, paused]);

  return (
    <div
      className={styles.leftPanel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      

      {/* Slide counter */}
      <div className={styles.slideCounter}>
        {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      {/* Slides */}
      <div className={styles.sliderTrack}>
        {SLIDES.map((slide, i) => (
          <div key={i} className={`${styles.slide} ${i === current ? styles.slideActive : ""}`}>
            <img
              src={slide.img}
              alt={slide.headline}
              className={styles.slideImg}
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className={styles.slideOverlay} />
            {i === current && (
              <div className={styles.slideContent}>
                <div className={styles.slideLabel}>
                  <span className={styles.labelDot} />
                  {slide.label}
                </div>
                <h2 className={styles.slideHeadline}>
                  {slide.headline.split("\n").map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </h2>
                <p className={styles.slideSub}>{slide.sub}</p>
                <Link to={slide.ctaPath} className={styles.slideCta}>
                  {slide.cta}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button className={`${styles.sliderArrow} ${styles.sliderArrowLeft}`} onClick={prev} aria-label="Previous slide">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button className={`${styles.sliderArrow} ${styles.sliderArrowRight}`} onClick={next} aria-label="Next slide">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Dot indicators */}
      <div className={styles.sliderDots}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main Login Page ────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login } = useAuth();
  const nav       = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from || "/";

  const [tab,          setTab]         = useState("user");
  const [authMode,     setAuthMode]    = useState("login"); // "login" | "signup"
  const [email,        setEmail]       = useState("");
  const [name,         setName]        = useState("");
  const [userPassword, setUserPassword]= useState("");
  const [userShowPass, setUserShowPass]= useState(false);
  const [userLoading,  setUserLoading] = useState(false);
  const [adminEmail,   setAdminEmail]  = useState("");
  const [password,     setPassword]    = useState("");
  const [showPass,     setShowPass]    = useState(false);
  const [adminLoading, setAdminLoading]= useState(false);

  const handleUserAuth = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address"); return;
    }
    if (userPassword.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    setUserLoading(true);
    try {
      const { data } = authMode === "signup"
        ? await register({ email, password: userPassword, name: name.trim() })
        : await loginUser({ email, password: userPassword });
      login(data.data.token, data.data.user);
      toast.success(authMode === "signup" ? "Welcome to Tessa!" : "Login successful!");
      nav(from, { replace: true });
    } catch (err) { toast.error(err.message); }
    finally { setUserLoading(false); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const { data } = await adminLogin({ email: adminEmail, password });
      login(data.data.token, data.data.user);
      toast.success("Admin login successful!");
      nav("/admin", { replace: true });
    } catch (err) { toast.error(err.message); }
    finally { setAdminLoading(false); }
  };

  const handleTabChange = (t) => {
    setTab(t);
    setAuthMode("login");
    setEmail(""); setName(""); setUserPassword("");
    setAdminEmail(""); setPassword("");
  };

  const toggleAuthMode = () => {
    setAuthMode((m) => (m === "login" ? "signup" : "login"));
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>

        {/* ── Left: Image Slider ── */}
        <HeroSlider />

        {/* ── Right: Form ── */}
        <div className={styles.rightPanel}>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "user" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("user")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              User Login
            </button>
            <button
              className={`${styles.tab} ${tab === "admin" ? styles.tabActive : ""}`}
              onClick={() => handleTabChange("admin")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin
            </button>
          </div>

          {/* ── User: Email + Password ── */}
          {tab === "user" && (
            <div className={styles.formArea}>
              <form onSubmit={handleUserAuth}>
                <div className={styles.formHead}>
                  <h2 className={styles.formTitle}>
                    {authMode === "signup" ? "Create your account." : "Welcome back."}
                  </h2>
                  <p className={styles.formSub}>
                    {authMode === "signup"
                      ? "Sign up with your email address to get started."
                      : "Sign in to your account using your email address."}
                  </p>
                </div>

                {authMode === "signup" && (
                  <div className="form-group">
                    <label className="form-label">
                      Your Name <span className={styles.optional}>(optional)</span>
                    </label>
                    <input
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name (optional)"
                      autoComplete="name"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput}`}
                      type="email"
                      name="user-email"
                      id="user-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput} ${styles.passInput}`}
                      type={userShowPass ? "text" : "password"}
                      name="user-password"
                      id="user-password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={authMode === "signup" ? "Create a password (min. 6 characters)" : "Enter your password"}
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      required
                    />
                    <button type="button" className={styles.showPassBtn} onClick={() => setUserShowPass(!userShowPass)}>
                      {userShowPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  className={styles.submitBtn}
                  disabled={userLoading || !email || userPassword.length < 6}
                >
                  {userLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {authMode === "signup" ? "Creating account…" : "Signing in…"}</>
                  ) : (authMode === "signup" ? "Create Account" : "Login")}
                </button>

                <p className={styles.resendNote} style={{ textAlign: "center", marginTop: 12 }}>
                  {authMode === "signup" ? "Already have an account?" : "Don't have an account?"}
                  <button type="button" className={styles.textLink} onClick={toggleAuthMode} style={{ marginLeft: 6 }}>
                    {authMode === "signup" ? "Login" : "Sign up"}
                  </button>
                </p>

                <div className={styles.dividerRow}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>OR</span>
                  <span className={styles.dividerLine} />
                </div>

                <button type="button" className={styles.googleBtn} onClick={() => window.location.href =`${process.env.REACT_APP_API_URL}/auth/google` }>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
            </div>
          )}

          {/* ── Admin Login ── */}
          {tab === "admin" && (
            <div className={styles.formArea}>
              <div className={styles.adminBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin Access
              </div>
              <div className={styles.formHead}>
                <h2 className={styles.formTitle}>Secure Login.</h2>
                <p className={styles.formSub}>Restricted to authorized personnel only.</p>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput}`}
                      type="email"
                      name="admin-email"
                      id="admin-email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@tessa.in"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className={styles.inputWrap}>
                    <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className={`form-input ${styles.iconInput} ${styles.passInput}`}
                      type={showPass ? "text" : "password"}
                      name="admin-password"
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" className={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>
                      {showPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.adminMeta}>
                  <label className={styles.rememberLabel}>
                    <input type="checkbox" className={styles.rememberCheck} />
                    Remember me
                  </label>
                </div>

                <button className={styles.submitBtn} disabled={adminLoading}>
                  {adminLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
                  ) : "Login"}
                </button>

                <p className={styles.secureNote}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Secure Admin Panel · Authorized Access Only
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}