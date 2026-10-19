const Product = require("../models/Product");
const { sendSuccess, sendPaginated } = require("../utils/response");
const AppError = require("../utils/AppError");
const cache = require("../services/cacheService");
const { initFlashStock, getFlashStock, clearFlashSale } = require("../services/flashSaleService");

// ── Public Routes ─────────────────────────────────────────────────────────────

// GET /api/products
exports.getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    search,
    sort = "-createdAt",
    minPrice,
    maxPrice,
  } = req.query;

  const cacheKey = cache.KEYS.productList(JSON.stringify(req.query));
  const cached = await cache.get(cacheKey);
  if (cached) return res.json({ success: true, ...cached, fromCache: true });

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments(filter),
  ]);

  const response = {
    message: "Products fetched",
    data: products,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  };

  await cache.set(cacheKey, response, 30);
  res.json({ success: true, ...response });
};

// GET /api/products/featured
exports.getFeatured = async (req, res) => {
  const cached = await cache.get(cache.KEYS.featured);
  if (cached) return sendSuccess(res, cached);

  const products = await Product.find({ isActive: true, isFeatured: true })
    .sort("-createdAt")
    .limit(8)
    .lean();

  await cache.set(cache.KEYS.featured, products, 60);
  sendSuccess(res, products, "Featured products fetched");
};

// GET /api/products/flash-sales
exports.getFlashSaleProducts = async (req, res) => {
  const cached = await cache.get(cache.KEYS.flashSales);
  if (cached) return sendSuccess(res, cached);

  const now = new Date();
  const products = await Product.find({
    isActive: true,
    "flashSale.isActive": true,
    "flashSale.startTime": { $lte: now },
    "flashSale.endTime": { $gte: now },
  }).lean();

  // Attach real-time Redis stock to each product
  const enriched = await Promise.all(
    products.map(async (p) => {
      const redisStock = await getFlashStock(p._id.toString());
      return { ...p, redisFlashStock: redisStock };
    })
  );

  await cache.set(cache.KEYS.flashSales, enriched, 10); // short TTL — stock changes fast
  sendSuccess(res, enriched, "Flash sale products fetched");
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  const cached = await cache.get(cache.KEYS.product(req.params.id));
  if (cached) {
    const redisStock = await getFlashStock(req.params.id);
    return sendSuccess(res, { ...cached, redisFlashStock: redisStock });
  }

  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) return next(new AppError("Product not found", 404));

  const doc = product.toJSON();
  await cache.set(cache.KEYS.product(req.params.id), doc);

  const redisStock = await getFlashStock(req.params.id);
  sendSuccess(res, { ...doc, redisFlashStock: redisStock });
};

// ── Admin Routes ──────────────────────────────────────────────────────────────

// POST /api/products
exports.createProduct = async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  await cache.invalidateProduct(product._id.toString());
  sendSuccess(res, product, "Product created", 201);
};

// PATCH /api/products/:id
exports.updateProduct = async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return next(new AppError("Product not found", 404));
  await cache.invalidateProduct(req.params.id);
  sendSuccess(res, product, "Product updated");
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Product not found", 404));

  product.isActive = false;
  await product.save();
  await cache.invalidateProduct(req.params.id);
  sendSuccess(res, null, "Product deactivated");
};

// POST /api/products/:id/flash-sale
exports.setFlashSale = async (req, res, next) => {
  const { startTime, endTime, salePrice, flashStock } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Product not found", 404));
  if (!product.isActive) return next(new AppError("Cannot set flash sale on inactive product", 400));

  if (salePrice >= product.price) {
    return next(new AppError("Flash sale price must be less than regular price", 400));
  }

  product.flashSale = {
    isActive: true,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    salePrice,
    flashStock,
    flashSold: 0,
  };

  await product.save();
  // Pre-load stock into Redis
  await initFlashStock(product._id.toString(), flashStock);
  await cache.invalidateProduct(req.params.id);

  sendSuccess(res, product, "Flash sale configured");
};

// DELETE /api/products/:id/flash-sale
exports.cancelFlashSale = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Product not found", 404));

  product.flashSale.isActive = false;
  await product.save();
  await clearFlashSale(product._id.toString());
  await cache.invalidateProduct(req.params.id);

  sendSuccess(res, null, "Flash sale cancelled");
};

// GET /api/products (admin — includes inactive)
exports.adminGetProducts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find().sort("-createdAt").skip(skip).limit(Number(limit)),
    Product.countDocuments(),
  ]);

  sendPaginated(res, products, total, Number(page), Number(limit), "Products fetched");
};
