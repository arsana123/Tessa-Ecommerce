const router = require("express").Router();
const ctrl = require("../controllers/cartController");
const { protect } = require("../middleware/auth");
const { generalLimiter } = require("../middleware/rateLimiter");
const { validate, schemas } = require("../validators");

router.use(protect, generalLimiter);

router.get("/", ctrl.getCart);
router.post("/", validate(schemas.addToCart), ctrl.addToCart);
router.patch("/:productId", validate(schemas.updateCartItem), ctrl.updateCartItem);
router.delete("/:productId", ctrl.removeFromCart);
router.delete("/", ctrl.clearCart);

module.exports = router;
