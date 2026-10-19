import styles from "./PolicyPage.module.css";

export default function TermsAndConditions() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.label}>Legal</p>
          <h1 className={styles.title}>Terms &amp; Conditions</h1>
          <p className={styles.meta}>Effective date: 26 May 2026 &nbsp;·&nbsp; Last updated: 1 May 2026</p>
        </div>

        <div className={styles.body}>

          <section className={styles.section}>
            <h2 className={styles.heading}>1. Acceptance of Terms</h2>
            <p>By accessing or using Tessa at <a href="https://ecommerce-1-782g.onrender.com" className={styles.link}>https://ecommerce-1-782g.onrender.com</a>, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our platform.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>2. Use of the Platform</h2>
            <p>You agree to use Tessa only for lawful purposes. You must not:</p>
            <ul className={styles.list}>
              <li>Use the platform to commit fraud or misrepresent your identity</li>
              <li>Attempt to gain unauthorised access to any part of our system</li>
              <li>Place fake, test, or malicious orders</li>
              <li>Scrape, copy, or redistribute content from our platform without permission</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>3. Account Registration</h2>
            <p>To place an order, you must create an account using a valid email address. You are responsible for maintaining the confidentiality of your account and for all activities that occur under it. Notify us immediately at <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a> if you suspect unauthorised access.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>4. Products and Pricing</h2>
            <ul className={styles.list}>
              <li>We strive to display accurate product descriptions, images, and prices. However, errors may occasionally occur.</li>
              <li>Prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise.</li>
              <li>We reserve the right to correct pricing errors and cancel orders placed at incorrect prices, with a full refund issued.</li>
              <li>Product availability is not guaranteed. If a product becomes unavailable after your order, we will notify you and issue a full refund.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>5. Orders and Payments</h2>
            <ul className={styles.list}>
              <li>All orders are subject to acceptance and availability.</li>
              <li>Payments are processed securely through Razorpay. We accept UPI, credit/debit cards, net banking, and wallets.</li>
              <li>An order confirmation email will be sent once your payment is successful.</li>
              <li>Tessa reserves the right to cancel any order at its discretion, with a full refund.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>6. Shipping and Delivery</h2>
            <ul className={styles.list}>
              <li>Standard delivery: 4–7 business days.</li>
              <li>Flash sale orders: 2–3 business days.</li>
              <li>Delivery timelines are estimates and may vary due to courier or logistical delays.</li>
              <li>Tessa is not responsible for delays caused by incorrect shipping addresses provided by the customer.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>7. Intellectual Property</h2>
            <p>All content on Tessa — including logos, text, images, and code — is owned by or licensed to Tessa. You may not reproduce, distribute, or create derivative works without our written permission.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Tessa shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed the amount paid by you for the relevant order.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>9. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>10. Changes to Terms</h2>
            <p>We reserve the right to update these Terms at any time. Continued use of Tessa after changes constitutes your acceptance of the revised Terms.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>11. Contact Us</h2>
            <p>For questions about these Terms, contact us at:</p>
            <div className={styles.contactBox}>
              <p><strong>Tessa</strong></p>
              <p>Email: <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a></p>
              <p>Website: <a href="https://ecommerce-1-782g.onrender.com" className={styles.link}>https://ecommerce-1-782g.onrender.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}