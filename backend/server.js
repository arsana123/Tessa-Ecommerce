require("dotenv").config();
require("express-async-errors");

const express       = require("express");
const cors          = require("cors");
const helmet        = require("helmet");
const morgan        = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB          = require("./config/db");
const { getRedis }       = require("./config/redis");
const { getRazorpay }    = require("./config/razorpay");
const globalErrorHandler = require("./middleware/errorHandler");
const AppError           = require("./utils/AppError");

const authRoutes    = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes    = require("./routes/cart");
const orderRoutes   = require("./routes/orders");
const paymentRoutes = require("./routes/payment");

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:         process.env.CLIENT_URL || "http://localhost:3000",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Webhook route must come before express.json()
app.use("/api/payment", paymentRoutes);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/subscribe", require("./routes/subscriber"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.all("*", (req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
);

app.use(globalErrorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const redis = getRedis();
  await redis.connect();

  try { getRazorpay(); } catch (err) {
    process.stdout.write(`WARN: Razorpay not configured — ${err.message}\n`);
  }

  app.listen(PORT, () => {
    process.stdout.write(`dropt API → http://localhost:${PORT}\n`);
    process.stdout.write(`Environment  → ${process.env.NODE_ENV}\n`);
  });
};

start().catch((err) => {
  process.stderr.write(`Startup error: ${err.message}\n`);
  process.exit(1);
});