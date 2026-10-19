const router = require("express").Router();
const ctrl = require("../controllers/productController");
const { protect, requireAdmin } = require("../middleware/auth");
const { generalLimiter } = require("../middleware/rateLimiter");
const { validate, schemas } = require("../validators");

// Public
router.get("/", generalLimiter, ctrl.getProducts);
router.get("/featured", generalLimiter, ctrl.getFeatured);
router.get("/flash-sales", generalLimiter, ctrl.getFlashSaleProducts);
router.get("/:id", generalLimiter, ctrl.getProduct);

// Admin
router.get("/admin/all", ...requireAdmin, ctrl.adminGetProducts);
router.post("/", ...requireAdmin, validate(schemas.createProduct), ctrl.createProduct);
router.patch("/:id", ...requireAdmin, validate(schemas.updateProduct), ctrl.updateProduct);
router.delete("/:id", ...requireAdmin, ctrl.deleteProduct);
router.post("/:id/flash-sale", ...requireAdmin, validate(schemas.setFlashSale), ctrl.setFlashSale);
router.delete("/:id/flash-sale", ...requireAdmin, ctrl.cancelFlashSale);

module.exports = router;
