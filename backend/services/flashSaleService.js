/**
 * Flash Sale Service
 *
 * All flash-sale critical paths go through Redis atomic operations:
 *
 * 1. Stock decrement  → DECR (atomic, single CPU instruction)
 * 2. User lock        → SET NX (set-if-not-exists, prevents duplicates)
 * 3. Purchase marker  → Persistent SET (survives lock TTL)
 */

const { getRedis } = require("../config/redis");

const KEYS = {
  stock: (productId) => `flash:stock:${productId}`,
  userLock: (userId, productId) => `flash:lock:${userId}:${productId}`,
  purchased: (userId, productId) => `flash:purchased:${userId}:${productId}`,
  saleActive: (productId) => `flash:active:${productId}`,
};

const LOCK_TTL = 15; // seconds — window to complete purchase

// ── Stock Management ──────────────────────────────────────────────────────────

/**
 * Initialize flash stock in Redis.
 * Called when admin activates/updates a flash sale.
 */
const initFlashStock = async (productId, stock) => {
  const redis = getRedis();
  const key = KEYS.stock(productId);
  await redis.set(key, stock, "EX", 86400); // 24h TTL
  await redis.set(KEYS.saleActive(productId), "1", "EX", 86400);
};

/**
 * Atomically decrement flash stock by 1.
 *
 * DECR is a single atomic Redis operation — no two concurrent calls
 * can both see the same value. This is the primary overselling prevention.
 *
 * Returns:
 *   remaining >= 0  → purchase allowed (remaining is AFTER decrement)
 *   -1              → out of stock (we rolled back the decrement)
 */
const decrementFlashStock = async (productId) => {
  const redis = getRedis();
  const key = KEYS.stock(productId);

  const remaining = await redis.decr(key);

  if (remaining < 0) {
    // Roll back: restore the slot we over-decremented
    await redis.incr(key);
    return -1;
  }

  return remaining;
};

/**
 * Restore stock if an order fails after decrement (compensating transaction).
 */
const restoreFlashStock = async (productId) => {
  const redis = getRedis();
  await redis.incr(KEYS.stock(productId));
};

/**
 * Get current stock from Redis without modifying it.
 */
const getFlashStock = async (productId) => {
  const redis = getRedis();
  const val = await redis.get(KEYS.stock(productId));
  return val === null ? null : parseInt(val, 10);
};

/**
 * Clear Redis keys when a flash sale ends.
 */
const clearFlashSale = async (productId) => {
  const redis = getRedis();
  await redis.del(
    KEYS.stock(productId),
    KEYS.saleActive(productId)
  );
};

// ── Duplicate Purchase Prevention ─────────────────────────────────────────────

/**
 * Acquire per-user lock using SET NX (atomic).
 *
 * SET key value NX EX ttl is a single atomic operation in Redis.
 * Only the FIRST request from a user will get "OK". All others get null.
 * This prevents both:
 *   - Duplicate concurrent clicks (race conditions)
 *   - Rapid sequential requests within the TTL window
 *
 * Returns: true = lock acquired | false = already locked
 */
const acquireUserLock = async (userId, productId) => {
  const redis = getRedis();
  const result = await redis.set(
    KEYS.userLock(userId, productId),
    "1",
    "NX",
    "EX",
    LOCK_TTL
  );
  return result === "OK";
};

/**
 * Release the short-lived lock.
 * Called on order failure so the user can retry (with a clean state).
 */
const releaseUserLock = async (userId, productId) => {
  const redis = getRedis();
  await redis.del(KEYS.userLock(userId, productId));
};

/**
 * Set a permanent "already purchased" marker in Redis.
 * Persists for 24h, surviving the short-lived lock's TTL.
 * This is the final line of defense against duplicate flash orders.
 */
const markUserPurchased = async (userId, productId) => {
  const redis = getRedis();
  await redis.set(KEYS.purchased(userId, productId), "1", "EX", 86400);
};

/**
 * Check if user has already purchased this flash product.
 */
const hasUserPurchased = async (userId, productId) => {
  const redis = getRedis();
  return (await redis.exists(KEYS.purchased(userId, productId))) === 1;
};

module.exports = {
  initFlashStock,
  decrementFlashStock,
  restoreFlashStock,
  getFlashStock,
  clearFlashSale,
  acquireUserLock,
  releaseUserLock,
  markUserPurchased,
  hasUserPurchased,
};
