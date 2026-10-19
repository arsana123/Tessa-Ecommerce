const { getRedis } = require("../config/redis");

const TTL = 60; // seconds

const KEYS = {
  productList: (query) => `cache:products:${query}`,
  product: (id) => `cache:product:${id}`,
  featured: "cache:products:featured",
  flashSales: "cache:products:flash",
};

const get = async (key) => {
  try {
    const redis = getRedis();
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null; // Cache miss on Redis error — always safe to return null
  }
};

const set = async (key, data, ttl = TTL) => {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Cache write failure is non-fatal
  }
};

const del = async (...keys) => {
  try {
    const redis = getRedis();
    if (keys.length) await redis.del(...keys);
  } catch {
    // Cache invalidation failure is non-fatal
  }
};

const invalidateProduct = async (id) => {
  await del(
    KEYS.product(id),
    KEYS.featured,
    KEYS.flashSales
  );
  // Invalidate product list pages (pattern delete)
  try {
    const redis = getRedis();
    const listKeys = await redis.keys("cache:products:*");
    if (listKeys.length) await redis.del(...listKeys);
  } catch {
    // Safe to ignore
  }
};

module.exports = { get, set, del, invalidateProduct, KEYS };
