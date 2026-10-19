import { Link } from "react-router-dom";
import { useState } from "react";
import { subscribeEmail } from "../../api";  // adjust path if needed
import toast from "react-hot-toast";
import styles from "./Footer.module.css";

function FooterLogo() {
  return (
    <span className={styles.logoLockup}>
      <img src="/images/brand/logo.png" alt="" className={styles.logoImg} width="52" height="52" loading="lazy" />
      <span className={styles.logoWord}>Tessa</span>
    </span>
  );
}

const FOOTER_LINKS = {
  Shop: [
    { label: "Flash Edit",        to: "/products?flash=true" },
    { label: "All Pieces",       to: "/products" },
    { label: "Gowns",            to: "/products?category=Gowns" },
    { label: "Tops",             to: "/products?category=Tops" },
    { label: "Co-ords",          to: "/products?category=Co-ords" },
    { label: "Sarees",           to: "/products?category=Sarees" },
  ],
  Account: [
    { label: "Sign In",          to: "/login" },
    { label: "My Cart",          to: "/cart" },
    { label: "My Orders",        to: "/orders" },
  ],
  Company: [
    { label: "Contact",          to: "/contact" },
    { label: "Privacy Policy",   to: "/privacy" },
    { label: "Refund Policy",    to: "/refund" },
    { label: "Terms of Use",     to: "/terms" },
  ],
};

/* ── Social / contact icons ─────────────────────────────────────────────── */
const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/archanasiingh03/",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919508580318",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.535 5.876L.057 23.882l6.196-1.453A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.893 0-3.667-.523-5.186-1.427l-.371-.22-3.676.862.925-3.556-.242-.38A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
    ),
  },
];

function FooterNewsletter() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email"); return;
    }
    setLoading(true);
    try {
      const res = await subscribeEmail(email);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.nlBox} onSubmit={handleSubmit}>
      <input
        className={styles.nlInput}
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <button className={styles.nlBtn} type="submit" disabled={loading}>
        {loading ? "…" : "→"}
      </button>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>

      {/* Trust strip */}
      <div className={styles.trustStrip}>
        <div className={styles.stripContainer}>
          {[
            { icon: "🚚", label: "Free Delivery on ₹499+" },
            { icon: "↩️", label: "14-Day Easy Returns" },
            { icon: "🔒", label: "100% Secure Checkout" },
            { icon: "⚡", label: "New Drops Every Friday" },
          ].map((item) => (
            <div key={item.label} className={styles.stripItem}>
              <span className={styles.stripEmoji}>{item.icon}</span>
              <span className={styles.stripLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main body */}
      <div className={styles.body}>
        <div className={styles.container}>
          <div className={styles.grid}>

            {/* Brand col */}
            <div className={styles.brandCol}>
              <Link to="/" className={styles.logoLink}>
                <FooterLogo />
              </Link>
              <p className={styles.brandDesc}>
                Freshest drops, real prices. Discover trending products before they sell out.
              </p>

              {/* Contact info */}
              <div className={styles.contactList}>
                <a href="https://maps.google.com/?q=LPU+Punjab" target="_blank" rel="noreferrer" className={styles.contactItem}>
                  <span className={styles.contactIcon}>
                    {/* location pin */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span>LPU, Punjab — GH6</span>
                </a>
                <a href="mailto:siingharchana01234@gmail.com" className={styles.contactItem}>
                  <span className={styles.contactIcon}>
                    {/* mail */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <span>archanasiingh00@gmail.com</span>
                </a>
                <a href="tel:+919508580318" className={styles.contactItem}>
                  <span className={styles.contactIcon}>
                    {/* phone */}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.33h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <span>+91 9508580318</span>
                </a>
              </div>

              {/* Social buttons */}
              <div className={styles.socialRow}>
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialBtn}
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([heading, items]) => (
              <div key={heading} className={styles.linkCol}>
                <h4 className={styles.colHeading}>{heading}</h4>
                <ul className={styles.linkList}>
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link to={item.to} className={styles.footLink}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter col */}
            <div className={styles.linkCol}>
              <h4 className={styles.colHeading}>Get Drop Alerts</h4>
              <p className={styles.nlDesc}>Be first to know when new drops go live.</p>
              <FooterNewsletter />
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>© {new Date().getFullYear()} Tessa. All rights reserved.</p>
            <div className={styles.paymentRow}>
              {["Visa", "Mastercard", "UPI", "Razorpay"].map((p) => (
                <span key={p} className={styles.payBadge}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}