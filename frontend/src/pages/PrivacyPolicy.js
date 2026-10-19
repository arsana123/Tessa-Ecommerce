import styles from "./PolicyPage.module.css";

export default function PrivacyPolicy() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.label}>Legal</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.meta}>Effective date: 26 May 2026 &nbsp;·&nbsp; Last updated: 26 May 2026</p>
        </div>

        <div className={styles.body}>

          <section className={styles.section}>
            <h2 className={styles.heading}>1. About This Policy</h2>
            <p>Tessa ("we", "our", or "us") operates the website <a href="https://ecommerce-1-782g.onrender.com" className={styles.link}>https://ecommerce-1-782g.onrender.com</a>. This Privacy Policy explains how we collect, use, and protect your personal information when you visit or shop on our platform. By using Tessa, you agree to the practices described here.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className={styles.list}>
              <li><strong>Account information</strong> — your name, email address, and profile details when you register or sign in via Google.</li>
              <li><strong>Order information</strong> — shipping address, phone number, and order history when you make a purchase.</li>
              <li><strong>Payment information</strong> — payments are processed by Razorpay. We do not store your card or UPI details on our servers.</li>
              <li><strong>Usage data</strong> — pages visited, products viewed, browser type, IP address, and device information collected automatically.</li>
              <li><strong>Communications</strong> — emails or messages you send us for support.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>3. How We Use Your Information</h2>
            <ul className={styles.list}>
              <li>Process and fulfil your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Respond to customer support queries</li>
              <li>Improve our website, products, and services</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to any third party for marketing purposes.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>4. Sharing Your Information</h2>
            <p>We share your data only where necessary:</p>
            <ul className={styles.list}>
              <li><strong>Razorpay</strong> — to process payments securely.</li>
              <li><strong>Shipping partners</strong> — your name, address, and phone number to deliver your order.</li>
              <li><strong>Google</strong> — if you choose to sign in with Google, subject to Google's own privacy policy.</li>
              <li><strong>Legal authorities</strong> — if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>5. Cookies</h2>
            <p>We use cookies and similar technologies to keep you signed in, remember your cart, and understand how visitors use our site. You can disable cookies in your browser settings, though some features may not work correctly.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>6. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, secure authentication tokens, and restricted access to personal data. However, no method of transmission over the internet is 100% secure and we cannot guarantee absolute security.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>7. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services and comply with legal obligations. You may request deletion of your account and data at any time by contacting us.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className={styles.list}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>9. Children's Privacy</h2>
            <p>Tessa is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website. Continued use of Tessa after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>11. Contact Us</h2>
            <p>For any privacy-related questions or requests, please contact:</p>
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