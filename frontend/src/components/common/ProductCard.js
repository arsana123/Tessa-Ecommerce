import { Link } from "react-router-dom";
import { useCountdown } from "../../hooks/useCountdown";
import styles from "./ProductCard.module.css";

const pct = (price, mrp) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export default function ProductCard({ product }) {
  const now   = new Date();
  const flash = product.flashSale;

  const isFlashLive =
    flash?.isActive &&
    new Date(flash.startTime) <= now &&
    new Date(flash.endTime)   >= now;

  const { timeLeft, isExpired } = useCountdown(
    isFlashLive ? flash.endTime : null
  );

  const displayPrice = isFlashLive ? flash.salePrice : product.price;
  const displayMrp   = product.mrp || product.price;
  const discount     = isFlashLive
    ? pct(flash.salePrice, product.price)
    : pct(product.price, product.mrp);

  const redisStock = product.redisFlashStock;
  const stockLow   = redisStock !== null && redisStock !== undefined && redisStock <= 5;
  const stockPct   = flash?.flashStock
    ? Math.min(100, Math.max(0, (redisStock / flash.flashStock) * 100))
    : 100;

  return (
    <Link to={`/products/${product._id}`} className={styles.card}>

      {/* ── Image ── */}
      <div className={styles.imageWrap}>
        <img
          src={product.images?.[0] || "/images/brand/logo.png"}
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />

        {/* Discount badge — top left */}
        {discount > 0 && (
          <div className={styles.discountBadge}>−{discount}%</div>
        )}

        {/* Flash badge — top right */}
        {isFlashLive && !isExpired && (
          <div className={styles.flashBadge}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Flash
          </div>
        )}

        {/* Featured badge — top right (only if no flash) */}
        {product.isFeatured && !isFlashLive && (
          <div className={styles.featuredBadge}>Featured</div>
        )}

        {/* Hover overlay */}
        <div className={styles.overlay}>
          <span className={styles.viewBtn}>View Details</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {product.brand && (
          <p className={styles.brand}>{product.brand}</p>
        )}
        <h3 className={styles.name}>{product.name}</h3>

        <div className={styles.priceRow}>
          <span className={`${styles.price} ${isFlashLive ? styles.flashPrice : ""}`}>
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <span className={styles.mrp}>₹{displayMrp.toLocaleString("en-IN")}</span>
          )}
        </div>

        {/* Flash live: timer + stock alert */}
        {isFlashLive && !isExpired ? (
          <div className={styles.flashFooter}>
            <div className={styles.timer}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {timeLeft}
            </div>
            {stockLow && redisStock > 0 && (
              <span className={styles.stockAlert}>{redisStock} left</span>
            )}
            {redisStock <= 0 && (
              <span className={styles.soldOut}>Sold Out</span>
            )}
          </div>
        ) : flash?.isActive && !isFlashLive && new Date(flash.startTime) > now ? (
          <p className={styles.upcoming}>
            Starts {new Date(flash.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}

        {/* Stock bar */}
        {isFlashLive && !isExpired && flash?.flashStock && (
          <div className={styles.stockBar}>
            <div className={styles.stockBarFill} style={{ width: `${stockPct}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}