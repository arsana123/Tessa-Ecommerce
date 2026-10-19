import styles from "./PolicyPage.module.css";

export default function RefundPolicy() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.hero}>
          <p className={styles.label}>Legal</p>
          <h1 className={styles.title}>Refund &amp; Cancellation Policy</h1>
          <p className={styles.meta}>Effective date: 26 May 2026 &nbsp;·&nbsp; Last updated: 26 May 2026</p>
        </div>

        <div className={styles.body}>

          <section className={styles.section}>
            <h2 className={styles.heading}>1. Cancellations</h2>
            <p>You may cancel your order within <strong>24 hours of placing it</strong>, provided it has not yet been shipped. To cancel, email us at <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a> with your order ID. Once an order has been dispatched, it cannot be cancelled — you may instead initiate a return after delivery.</p>
            <p style={{ marginTop: 12 }}><strong>Flash sale orders</strong> cannot be cancelled once payment is confirmed, as these are time-limited and processed immediately.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>2. Returns</h2>
            <p>We accept returns within <strong>7 days of delivery</strong> under the following conditions:</p>
            <ul className={styles.list}>
              <li>The item is unused, unwashed, and in its original packaging</li>
              <li>Tags and labels are intact</li>
              <li>The item is not from the non-returnable categories listed below</li>
            </ul>
            <p>To initiate a return, email <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a> with your order ID and reason for return. We will provide a return shipping address.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>3. Non-Returnable Items</h2>
            <p>The following items are not eligible for return:</p>
            <ul className={styles.list}>
              <li>Innerwear, socks, and swimwear</li>
              <li>Perishable or consumable goods</li>
              <li>Items marked "Final Sale" or purchased during flash sales</li>
              <li>Items that have been used, washed, or damaged after delivery</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>4. Refunds</h2>
            <p>Once we receive and inspect your returned item, we will notify you of the refund status within <strong>2 business days</strong>. Approved refunds are processed as follows:</p>
            <ul className={styles.list}>
              <li><strong>UPI / Net Banking / Wallets</strong> — refunded to the original payment source within 5–7 business days</li>
              <li><strong>Credit / Debit Cards</strong> — refunded within 7–10 business days depending on your bank</li>
            </ul>
            <p>Shipping charges are non-refundable unless the return is due to a defective or incorrect item sent by us.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>5. Damaged or Incorrect Items</h2>
            <p>If you receive a damaged, defective, or incorrect item, please contact us within <strong>48 hours of delivery</strong> with:</p>
            <ul className={styles.list}>
              <li>Your order ID</li>
              <li>A photograph of the item and the packaging</li>
              <li>A brief description of the issue</li>
            </ul>
            <p>We will arrange a free return pickup and issue a full refund or replacement at no additional cost.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>6. Late or Missing Refunds</h2>
            <p>If you haven't received your refund within the stated timeline, please check with your bank first. If the issue persists, contact us at <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a> and we will investigate with Razorpay.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>7. Contact Us</h2>
            <p>For all cancellation and refund queries:</p>
            <div className={styles.contactBox}>
              <p><strong>Tessa</strong></p>
              <p>Email: <a href="mailto:siingharchana2003@gmail.com" className={styles.link}>siingharchana2003@gmail.com</a></p>
              <p>Response time: within 24–48 business hours</p>
              <p>Website: <a href="https://ecommerce-1-782g.onrender.com" className={styles.link}>https://ecommerce-1-782g.onrender.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}