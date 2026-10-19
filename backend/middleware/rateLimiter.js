const { getRedis } = require("../config/redis");
const AppError = require("../utils/AppError");

const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS) || 60;
const DEFAULT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60;
const AUTH_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10;
const FLASH_MAX = parseInt(process.env.FLASH_RATE_LIMIT_MAX) || 5;

/**
 * Redis-based rate limiter using sliding counter (INCR + EXPIRE).
 *
 * Key: rl:<identifier>  — per authenticated user or per IP.
 * Sets X-RateLimit-* headers on every response.
 *
 * Fails open: if Redis is unavailable, requests are allowed through
 * to prevent cache outages from blocking all traffic.
 */
const rateLimiter = (maxRequests = DEFAULT_MAX, windowSeconds = WINDOW) => {
  return async (req, res, next) => {
    const identifier = req.user?.id || req.ip;
    const key = `rl:${maxRequests}:${identifier}`;

    try {
      const redis = getRedis();
      const current = await redis.incr(key);

      // Set TTL only on first request in the window
      if (current === 1) await redis.expire(key, windowSeconds);

      const remaining = Math.max(0, maxRequests - current);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Window", windowSeconds);

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", ttl);
        return next(
          new AppError(`Rate limit exceeded. Try again in ${ttl} seconds.`, 429)
        );
      }

      next();
    } catch (err) {
      // Fail open — log but don't block
      console.error("Rate limiter error (fail-open):", err.message);
      next();
    }
  };
};

// Pre-configured limiters for different route groups
const generalLimiter = rateLimiter(DEFAULT_MAX, WINDOW);
const authLimiter = rateLimiter(AUTH_MAX, WINDOW);
const flashLimiter = rateLimiter(FLASH_MAX, WINDOW);

module.exports = { rateLimiter, generalLimiter, authLimiter, flashLimiter };
