const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");

// GET /api/cart
exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id }).populate(
    "items.productId",
    "name price mrp images category stock isActive flashSale"
  );

  // Calculate totals
  let subtotal = 0;
  const items = (cart?.items || []).map((item) => {
    const p = item.productId;
    if (!p || !p.isActive) return null;
    const price = p.isFlashLive ? p.flashSale.salePrice : p.price;
    subtotal += price * item.quantity;
    return { ...item.toObject(), currentPrice: price };
  }).filter(Boolean);

  sendSuccess(res, {
    cart: { items, subtotal, itemCount: items.reduce((a, i) => a + i.quantity, 0) },
  });
};

// POST /api/cart
exports.addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) return next(new AppError("Product not found", 404));
  if (product.stock < quantity) {
    return next(new AppError(`Only ${product.stock} units available`, 400));
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

  const existing = cart.items.find(
    (i) => i.productId.toString() === productId
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > 10) return next(new AppError("Maximum 10 units per item allowed", 400));
    existing.quantity = newQty;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  sendSuccess(res, { itemCount: cart.items.length }, "Added to cart");
};

// PATCH /api/cart/:productId
exports.updateCartItem = async (req, res, next) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) return next(new AppError("Cart not found", 404));

  const item = cart.items.find((i) => i.productId.toString() === productId);
  if (!item) return next(new AppError("Item not in cart", 404));

  item.quantity = quantity;
  await cart.save();
  sendSuccess(res, null, "Cart updated");
};

// DELETE /api/cart/:productId
exports.removeFromCart = async (req, res, next) => {
  const { productId } = req.params;

  const cart = await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $pull: { items: { productId } } },
    { new: true }
  );
  if (!cart) return next(new AppError("Cart not found", 404));

  sendSuccess(res, { itemCount: cart.items.length }, "Item removed");
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });
  sendSuccess(res, null, "Cart cleared");
};
