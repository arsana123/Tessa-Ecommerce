import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getFeatured, getFlashSales, subscribeEmail } from "../api";
import ProductCard from "../components/common/ProductCard";
import { useCountdown } from "../hooks/useCountdown";
import styles from "./HomePage.module.css";

/* ── static content ─────────────────────────────────────────────────────── */
const COLLECTIONS = [
  { name: "Gowns",   sub: "Evening, bridal & ballgowns", img: "/images/products/porcelain-bloom-gown.jpg" },
  { name: "Tops",    sub: "Lace, organza & corsets",     img: "/images/products/cornflower-ruffle-top.jpg" },
  { name: "Co-ords", sub: "Tweed & tailored sets",       img: "/images/products/claret-tweed-set.jpg" },
  { name: "Sarees",  sub: "Painted organza drapes",      img: "/images/products/tulip-bloom-saree.jpg" },
];

const LOOKBOOK = [
  { img: "/images/products/lagoon-veil-gown.jpg",   alt: "Teal tulle gown" },
  { img: "/images/products/midnight-moon-gown.jpg", alt: "Navy moonlit gown" },
  { img: "/images/products/pearl-mist-gown.jpg",    alt: "Pearl-draped blue gown" },
];

const PROMISES = [
  { title: "Free delivery",   sub: "On orders above ₹499" },
  { title: "Easy returns",    sub: "14-day return policy" },
  { title: "Secure payments", sub: "Encrypted by Razorpay" },
  { title: "Here to help",    sub: "Write to us any time" },
];

/* ── helpers ────────────────────────────────────────────────────────────── */
function FlashCountdown({ endTime }) {
  const { parts, isExpired } = useCountdown(endTime);
  if (isExpired || !parts) return <span className={styles.timerExpired}>Edit has ended</span>;
  return (
    <div className={styles.timer} aria-label="Time remaining">
      {[["h", parts.h], ["m", parts.m], ["s", parts.s]].map(([lbl, val]) => (
        <div key={lbl} className={styles.timerUnit}>
          <span className={styles.timerDigit}>{String(val).padStart(2, "0")}</span>
          <span className={styles.timerLabel}>{lbl}</span>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className={styles.skCard}>
      <div className={`${styles.skImg} skeleton`} />
      <div className={styles.skBody}>
        <div className="skeleton" style={{ width: "50%", height: 8 }} />
        <div className="skeleton" style={{ width: "88%", height: 12 }} />
        <div className="skeleton" style={{ width: "40%", height: 14 }} />
      </div>
    </div>
  );
}

/* ── page ───────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [featured,        setFeatured]        = useState([]);
  const [flashProducts,   setFlashProducts]   = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingFlash,    setLoadingFlash]    = useState(true);
  const [email,           setEmail]           = useState("");
  const [subscribed,      setSubscribed]      = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    getFeatured()
      .then(({ data }) => setFeatured(data.data || []))
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoadingFeatured(false));
    getFlashSales()
      .then(({ data }) => setFlashProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingFlash(false));
  }, []);

  const nearestFlashEnd = flashProducts[0]?.flashSale?.endTime || null;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    try {
      const res = await subscribeEmail(email);
      setSubscribed(true);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.page}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.heroKicker}>Tessa · gowns, tops &amp; tailored sets</p>
          <h1 className={styles.heroHeading}>
            Dressed for<br />every chapter.
          </h1>
          <p className={styles.heroSub}>
            Hand-finished gowns, lace blouses and tailored sets in burgundy, blue and blush.
            Same dreams, new chapters, always you.
          </p>
          <div className={styles.heroActions}>
            <button className="btn btn-primary btn-lg" onClick={() => nav("/products?category=Gowns")}>
              Shop gowns
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById("flash-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              See the Flash Edit
            </button>
          </div>
        </div>

        <div className={styles.heroArt}>
          <div className={styles.archOuter}>
            <div className={styles.archInner}>
              <img
                src="/images/brand/hero-velvet.jpg"
                alt="Garnet velvet gown with a gold rose"
                className={styles.heroImg}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── COLLECTIONS ──────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Shop by collection</h2>
            <Link to="/products" className={styles.viewAll}>See every piece</Link>
          </div>
          <div className={styles.collectionGrid}>
            {COLLECTIONS.map((c) => (
              <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`} className={styles.collection}>
                <div className={styles.collectionArch}>
                  <img src={c.img} alt={c.name} className={styles.collectionImg} loading="lazy" />
                </div>
                <h3 className={styles.collectionName}>{c.name}</h3>
                <p className={styles.collectionSub}>{c.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLASH EDIT ───────────────────────────────────────────────────── */}
      <section id="flash-section" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <div className={styles.secHead}>
            <div>
              <h2 className={styles.secTitle}>The Flash Edit</h2>
              <p className={styles.secSub}>Limited pieces at limited-time prices.</p>
            </div>
            <div className={styles.flashRight}>
              {nearestFlashEnd && <FlashCountdown endTime={nearestFlashEnd} />}
              <Link to="/products?flash=true" className={styles.viewAll}>All flash pieces</Link>
            </div>
          </div>

          {loadingFlash ? (
            <div className={styles.productGrid}>{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : flashProducts.length === 0 ? (
            <div className={styles.emptyBox}>
              <p className={styles.emptyText}>No flash pieces right now.</p>
              <p className={styles.emptySub}>The next edit goes live soon. Subscribe below to hear first.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {flashProducts.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.secHead}>
            <h2 className={styles.secTitle}>Featured pieces</h2>
            <Link to="/products" className={styles.viewAll}>View all</Link>
          </div>
          {loadingFeatured ? (
            <div className={styles.productGrid}>{[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className={styles.productGrid}>
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── LOOKBOOK ─────────────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.lookbook}`}>
        <div className={styles.container}>
          <div className={styles.lookbookHead}>
            <h2 className={styles.lookbookTitle}>Evening, softly lit.</h2>
            <p className={styles.lookbookText}>
              Tulle that moves, pearls that catch the light and colours borrowed from midnight water.
              Every gown is finished by hand.
            </p>
            <Link to="/products?category=Gowns" className="btn btn-outline">Browse gowns</Link>
          </div>
          <div className={styles.lookbookRow}>
            {LOOKBOOK.map((l) => (
              <div key={l.img} className={styles.lookbookArch}>
                <img src={l.img} alt={l.alt} className={styles.lookbookImg} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMISES ─────────────────────────────────────────────────────── */}
      <section className={styles.promises}>
        <div className={styles.container}>
          <div className={styles.promiseGrid}>
            {PROMISES.map((p) => (
              <div key={p.title} className={styles.promise}>
                <p className={styles.promiseTitle}>{p.title}</p>
                <p className={styles.promiseSub}>{p.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <section className={styles.newsletter}>
        <div className={styles.container}>
          <div className={styles.nlBox}>
            <img src="/images/brand/logo.png" alt="" className={styles.nlLogo} width="84" height="84" loading="lazy" />
            <h2 className={styles.nlTitle}>Be first to the next chapter</h2>
            <p className={styles.nlSub}>New pieces and Flash Edit alerts, straight to your inbox.</p>
            {subscribed ? (
              <p className={styles.nlDone}>You're on the list. Thank you.</p>
            ) : (
              <form className={styles.nlForm} onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className={styles.nlInput}
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email address"
                />
                <button type="submit" className="btn btn-primary">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
