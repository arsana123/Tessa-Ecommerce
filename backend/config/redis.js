// const Redis = require("ioredis");

// let redis;

// const getRedis = () => {
//   if (!redis) {
//     redis = new Redis({
//       host: process.env.REDIS_HOST || "127.0.0.1",
//       port: parseInt(process.env.REDIS_PORT) || 6379,
//       password: process.env.REDIS_PASSWORD || undefined,
//       lazyConnect: true,
//       maxRetriesPerRequest: 3,
//       retryStrategy: (times) => {
//         if (times > 5) return null;
//         return Math.min(times * 300, 3000);
//       },
//       reconnectOnError: (err) => {
//         const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT"];
//         if (targetErrors.some((e) => err.message.includes(e))) return 2;
//         return false;
//       },
//     });

//     redis.on("connect", () => console.log("Redis connected"));
//     redis.on("error", (err) => console.error("Redis error:", err.message));
//     redis.on("reconnecting", () => console.log("Redis reconnecting..."));
//   }
//   return redis;
// };

// module.exports = { getRedis };
const { Redis } = require("@upstash/redis");

let redis;

const getRedis = () => {
  if (!redis) {
    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Wrapper to mimic ioredis-like behavior
    redis = {
      async connect() {
        // Upstash doesn't require connection
        return true;
      },

      async set(key, value, expiryMode, time) {
        if (expiryMode && time) {
          return await client.set(key, value, { ex: time });
        }
        return await client.set(key, value);
      },

      async get(key) {
        return await client.get(key);
      },

      async del(key) {
        return await client.del(key);
      },

      async incr(key) {
        return await client.incr(key);
      },

      async expire(key, seconds) {
        return await client.expire(key, seconds);
      },

      // Optional fallback methods if your app uses them
      async quit() {
        return true;
      },
    };

    console.log("Upstash Redis connected (wrapped for compatibility)");
  }

  return redis;
};

module.exports = { getRedis };