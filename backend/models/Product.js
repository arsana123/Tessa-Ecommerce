const mongoose = require("mongoose");

const flashSaleSchema = new mongoose.Schema(
  {
    isActive: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
    salePrice: { type: Number, min: 0 },
    flashStock: { type: Number, min: 0, default: 0 },
    // Track how many were sold during flash
    flashSold: { type: Number, default: 0 },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [2000, "Description too long"],
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    mrp: { type: Number, min: 0 },
    images: [{ type: String }],
    category: {
      type: String,
      required: true,
      enum: ["Gowns", "Tops", "Co-ords", "Sarees", "Electronics", "Fashion", "Home & Kitchen", "Sports", "Beauty", "Books", "Toys", "General"],
      default: "General",
    },
    brand: { type: String, trim: true, default: "" },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sold: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    flashSale: { type: flashSaleSchema, default: () => ({}) },
    tags: [String],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: is flash sale currently live?
productSchema.virtual("isFlashLive").get(function () {
  if (!this.flashSale?.isActive) return false;
  const now = new Date();
  return now >= this.flashSale.startTime && now <= this.flashSale.endTime;
});

// Virtual: effective price (flash if live, else regular)
productSchema.virtual("effectivePrice").get(function () {
  if (this.isFlashLive) return this.flashSale.salePrice;
  return this.price;
});

// Auto-generate slug before save
productSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
