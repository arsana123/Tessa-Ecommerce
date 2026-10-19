const router = require("express").Router();
const ctrl = require("../controllers/orderController");
const { protect, requireAdmin } = require("../middleware/auth");
const { generalLimiter, flashLimiter } = require("../middleware/rateLimiter");
const { validate, schemas } = require("../validators");

router.use(protect);

// Regular order flow
router.post("/", generalLimiter, validate(schemas.createOrder), ctrl.createOrder);
router.post("/verify-payment", generalLimiter, validate(schemas.verifyPayment), ctrl.verifyPayment);

// Flash order flow
router.post("/flash", flashLimiter, validate(schemas.flashOrder), ctrl.createFlashOrder);
router.post("/flash/verify-payment", flashLimiter, validate(schemas.verifyPayment), ctrl.verifyFlashPayment);

// User order history
router.get("/my", generalLimiter, ctrl.getMyOrders);
router.get("/:id", generalLimiter, ctrl.getOrder);

// Admin
router.get("/admin/all", ...requireAdmin, ctrl.getAllOrders);
router.patch("/admin/:id/status", ...requireAdmin, ctrl.updateOrderStatus);

module.exports = router;
