import { Link, useNavigate } from "react-router-dom";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
  const nav = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* pill label */}
        <div className={styles.pill}>
          <span className={styles.pillDot} />
          Error 404
        </div>

        {/* big number */}
        <div className={styles.code}>404</div>

        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.sub}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => nav(-1)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Go Back
          </button>
          <Link to="/" className={styles.btnOutline}>
            Go to Home
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* subtle trust row */}
        <div className={styles.links}>
          <Link to="/products" className={styles.quickLink}>Browse Products</Link>
          <span className={styles.dot}>·</span>
          <Link to="/products?flash=true" className={styles.quickLink}>Flash Deals</Link>
          <span className={styles.dot}>·</span>
          <Link to="/products?category=Fashion" className={styles.quickLink}>Fashion</Link>
        </div>

      </div>
    </div>
  );
}