import styles from "./PolicyPage.module.css";

export default function ContactUs() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.label}>Support</p>
          <h1 className={styles.title}>Contact Us</h1>
          <p className={styles.meta}>We typically respond within 24–48 business hours.</p>
        </div>

        <div className={styles.body}>

          <section className={styles.section}>
            <h2 className={styles.heading}>Get in Touch</h2>
            <p>Have a question about your order, a product, or our policies? We're here to help. Reach out to us using any of the methods below and we'll get back to you as soon as possible.</p>
          </section>

          <div className={styles.contactGrid}>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3 className={styles.contactCardTitle}>Email Support</h3>
              <p className={styles.contactCardSub}>For orders, returns, and general queries</p>
              <a href="mailto:gillanu2003@gmail.com" className={styles.contactValue}>
                gillanu2003@gmail.com
              </a>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 className={styles.contactCardTitle}>Support Hours</h3>
              <p className={styles.contactCardSub}>When we're available to help</p>
              <p className={styles.contactValue}>Mon – Sat, 10am – 6pm IST</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3 className={styles.contactCardTitle}>Location</h3>
              <p className={styles.contactCardSub}>Where we're based</p>
              <p className={styles.contactValue}>India</p>
            </div>

          </div>

          <section className={styles.section} style={{ marginTop: 40 }}>
            <h2 className={styles.heading}>Common Questions</h2>
            <div className={styles.faqList}>
              {[
                {
                  q: "Where is my order?",
                  a: "Log in to your account and visit the Orders page to track your order status. If you need further help, email us with your order ID."
                },
                {
                  q: "How do I return a product?",
                  a: "Email us within 7 days of delivery with your order ID and reason for return. See our Refund & Cancellation Policy for full details."
                },
                {
                  q: "My payment failed but money was deducted. What do I do?",
                  a: "This can happen due to a bank-side delay. The amount is usually auto-refunded within 5–7 business days. If not, email us with your transaction reference number."
                },
                {
                  q: "Can I change my shipping address after placing an order?",
                  a: "Address changes are only possible within 12 hours of placing the order and before dispatch. Email us immediately with your order ID."
                },
                {
                  q: "Do you ship outside India?",
                  a: "Currently we deliver only within India."
                },
              ].map((item, i) => (
                <div key={i} className={styles.faqItem}>
                  <p className={styles.faqQ}>{item.q}</p>
                  <p className={styles.faqA}>{item.a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}