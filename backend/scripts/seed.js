require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getRedis } = require("../config/redis");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const fromNow = (m) => new Date(Date.now() + m * 60 * 1000);
const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000);

// ── USERS (UPDATED TO EMAIL) ──────────────────────────────────────────────────
const USERS = [
  {
    email: process.env.ADMIN_EMAIL || "admin@gmail.com",
    name: "Admin User",
    role: "admin",
    isVerified: true,
    password: process.env.ADMIN_PASSWORD || "Admin@123",
  },
  {
    email: "arjun.sharma@example.com",
    name: "Arjun Sharma",
    role: "user",
    isVerified: true,
  },
  {
    email: "priya.mehta@example.com",
    name: "Priya Mehta",
    role: "user",
    isVerified: true,
  },
  {
    email: "rohit.verma@example.com",
    name: "Rohit Verma",
    role: "user",
    isVerified: true,
  },
];

// ── PRODUCTS — Tessa catalogue ────────────────────────────────────────────────
// Images live in frontend/public/images/products and are served by the frontend.
// Prices, stock and copy are placeholders — edit freely, or manage from the Admin page.
const img = (slug) => [`/images/products/${slug}.jpg`];
const PRODUCTS = [
  // ── Gowns ──
  { name: "Porcelain Bloom Embroidered Gown", category: "Gowns", brand: "Tessa",
    description: "Ivory satin gown with hand-embroidered blue porcelain florals, a beaded strapless neckline and a sweeping organza train.",
    price: 38900, mrp: 46900, stock: 8, images: img("porcelain-bloom-gown"), isFeatured: true, tags: ["gown", "embroidered", "blue", "bridal"],
    flashSale: { isActive: true, startTime: minsAgo(1), endTime: fromNow(180), salePrice: 33900, flashStock: 4, flashSold: 0 } },
  { name: "Garnet Velvet Slip Gown", category: "Gowns", brand: "Tessa",
    description: "Liquid velvet in deep garnet and gold. Cowl neckline, crystal chain straps and a floor-skimming mermaid hem.",
    price: 21900, mrp: 26900, stock: 14, images: img("garnet-velvet-gown"), isFeatured: true, tags: ["gown", "velvet", "burgundy", "evening"] },
  { name: "Pearl Mist Corset Gown", category: "Gowns", brand: "Tessa",
    description: "Powder-blue tulle over a sequin-embroidered corset, finished with draped pearl strands and sheer off-shoulder sleeves.",
    price: 27500, mrp: 32500, stock: 10, images: img("pearl-mist-gown"), isFeatured: true, tags: ["gown", "pearl", "tulle", "blue"] },
  { name: "Lagoon Veil Gown", category: "Gowns", brand: "Tessa",
    description: "Brocade corset bodice with a teal tulle overlay that falls like water. Made for portraits and slow entrances.",
    price: 24900, mrp: 29900, stock: 9, images: img("lagoon-veil-gown"), isFeatured: false, tags: ["gown", "teal", "tulle"] },
  { name: "Midnight Moon Gown", category: "Gowns", brand: "Tessa",
    description: "Navy silk and shimmer tulle with a hand-scattered crystal veil. Soft pearl-grey panel at the front.",
    price: 29900, mrp: 35900, stock: 7, images: img("midnight-moon-gown"), isFeatured: true, tags: ["gown", "navy", "sequin", "evening"],
    flashSale: { isActive: true, startTime: minsAgo(5), endTime: fromNow(120), salePrice: 25900, flashStock: 3, flashSold: 0 } },
  { name: "Silver Frost Ballgown", category: "Gowns", brand: "Tessa",
    description: "Strapless A-line ballgown in silver-grey, covered in beaded lace motifs. Sheer embroidered gloves and a jewelled collar included.",
    price: 42900, mrp: 49900, stock: 5, images: img("silver-frost-gown"), isFeatured: true, tags: ["gown", "silver", "beaded", "ballgown"] },
  { name: "Champagne Sequin Mermaid Gown", category: "Gowns", brand: "Tessa",
    description: "Off-shoulder mermaid silhouette in champagne tulle, hand-set with mother-of-pearl sequins and fine bead fringe.",
    price: 36900, mrp: 43900, stock: 6, images: img("champagne-sequin-gown"), isFeatured: true, tags: ["gown", "champagne", "sequin", "bridal"] },
  { name: "Sage Tulle Corset Gown", category: "Gowns", brand: "Tessa",
    description: "Pistachio-sage tulle skirt with a structured crystal-edged corset and draped off-shoulder sleeves.",
    price: 19900, mrp: 24900, stock: 12, images: img("sage-tulle-gown"), isFeatured: false, tags: ["gown", "sage", "tulle", "corset"] },
  { name: "Glacier Beaded Gown", category: "Gowns", brand: "Tessa",
    description: "Ice-blue gown with sequin and bead embroidery, a strapless corset and sheer sleeves that tie at the wrist.",
    price: 34900, mrp: 40900, stock: 6, images: img("glacier-beaded-gown"), isFeatured: false, tags: ["gown", "ice-blue", "beaded"] },

  // ── Sarees ──
  { name: "Tulip Bloom Organza Saree", category: "Sarees", brand: "Tessa",
    description: "Blush organza saree painted with tulips and trailing leaves, paired with a tulip-bloom blouse. Soft, graceful and light.",
    price: 18900, mrp: 22900, stock: 15, images: img("tulip-bloom-saree"), isFeatured: true, tags: ["saree", "organza", "floral", "pink"] },

  // ── Tops ──
  { name: "Cornflower Ruffle Corset Top", category: "Tops", brand: "Tessa",
    description: "Sky-blue floral jacquard with a ruffled cream neckline, velvet bow and pearl button detail. Tie-ribbon cap sleeves.",
    price: 3499, mrp: 4499, stock: 40, images: img("cornflower-ruffle-top"), isFeatured: true, tags: ["top", "corset", "blue", "ruffle"],
    flashSale: { isActive: true, startTime: minsAgo(2), endTime: fromNow(90), salePrice: 2799, flashStock: 15, flashSold: 0 } },
  { name: "Sage Lace Flare-Sleeve Top", category: "Tops", brand: "Tessa",
    description: "Textured floral lace in deep sage with a scoop neck, bell sleeves and a side-slit hem.",
    price: 2799, mrp: 3599, stock: 55, images: img("sage-lace-top"), isFeatured: false, tags: ["top", "lace", "green"] },
  { name: "Bluebell Organza Blouse", category: "Tops", brand: "Tessa",
    description: "Sheer blue organza embroidered with white blossoms, balloon sleeves and a ruffled peplum hem.",
    price: 4999, mrp: 6299, stock: 25, images: img("bluebell-organza-blouse"), isFeatured: true, tags: ["blouse", "organza", "blue", "floral"] },
  { name: "Blush Blossom Peplum Blouse", category: "Tops", brand: "Tessa",
    description: "Blush organza blouse with 3D flowers and pearl beading, layered peplum and sheer puffed sleeves.",
    price: 6999, mrp: 8499, stock: 18, images: img("blush-blossom-blouse"), isFeatured: true, tags: ["blouse", "peplum", "pink", "beaded"] },
  { name: "Sapphire Sequin Peplum Top", category: "Tops", brand: "Tessa",
    description: "Fitted corset top covered in sapphire sequins, with puff sleeves and a flared peplum waist.",
    price: 5499, mrp: 6799, stock: 20, images: img("sapphire-peplum-top"), isFeatured: false, tags: ["top", "sequin", "blue", "peplum"] },
  { name: "Dusk Blue Beaded-Neck Top", category: "Tops", brand: "Tessa",
    description: "Structured slate-blue top with a curved neckline hand-set with pearls and crystals, and sculpted puff sleeves.",
    price: 4799, mrp: 5999, stock: 22, images: img("dusk-beaded-neck-top"), isFeatured: false, tags: ["top", "beaded", "blue"] },
  { name: "Ivory Lace Ruffle Blouse", category: "Tops", brand: "Tessa",
    description: "High-neck ivory lace blouse with tiered ruffle shoulders and a scalloped hem. Pairs with a silk skirt.",
    price: 5299, mrp: 6499, stock: 24, images: img("ivory-lace-blouse"), isFeatured: true, tags: ["blouse", "lace", "ivory"] },

  // ── Co-ords ──
  { name: "Rosewood Coat & Trouser Set", category: "Co-ords", brand: "Tessa",
    description: "Dusty-rose wrap coat with a mohair knit and high-waist claret trousers. Tailored for cold mornings.",
    price: 12999, mrp: 15999, stock: 16, images: img("rosewood-coat-set"), isFeatured: true, tags: ["coat", "set", "winter", "burgundy"] },
  { name: "Claret Tweed Jacket & Trousers", category: "Co-ords", brand: "Tessa",
    description: "Claret tweed jacket with a jewelled chain belt and crystal buttons, with wide-leg cream trousers.",
    price: 10999, mrp: 13499, stock: 18, images: img("claret-tweed-set"), isFeatured: true, tags: ["tweed", "set", "burgundy", "tailored"] },
  { name: "Rose Tweed Jacket & Trousers", category: "Co-ords", brand: "Tessa",
    description: "Cropped rose-pink tweed jacket with fringed pockets, a cream collared blouse and high-waist trousers.",
    price: 9999, mrp: 12499, stock: 20, images: img("rose-tweed-set"), isFeatured: false, tags: ["tweed", "set", "pink", "tailored"] },
];

// ── SEED FUNCTION ─────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const redis = getRedis();
  await redis.connect();
  console.log("Redis connected\n");

  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
  ]);
  console.log("Collections cleared");

  for (const u of USERS) {
    const user = await User.create(u); // FIXED: no manual hashing
    console.log(`User: ${user.email} (${user.role})`);
  }

  console.log("\nSeeding products...");
  const createdProducts = [];

  for (const pd of PRODUCTS) {
    const slug =
      pd.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    const product = await Product.create({ ...pd, slug });
    createdProducts.push(product);
    console.log(`  + ${product.name}`);
  }

  console.log("\nSyncing flash sales to Redis...");
  let flashCount = 0;

  for (const product of createdProducts) {
    const flash = product.flashSale;
    if (flash && flash.isActive && flash.flashStock > 0) {
      await redis.set(`flash:stock:${product._id}`, flash.flashStock, "EX", 86400);
      await redis.set(`flash:active:${product._id}`, "1", "EX", 86400);
      console.log(`  Redis: "${product.name}" -> ${flash.flashStock} units @ Rs.${flash.salePrice}`);
      flashCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("SEED COMPLETE");
  console.log("=".repeat(50));
  console.log(`Users: ${USERS.length} | Products: ${createdProducts.length} | Flash sales: ${flashCount}`);
  console.log(`\nAdmin: ${process.env.ADMIN_EMAIL || "admin@dropt.com"} / ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
  console.log("Test users: arjun.sharma@example.com | priya.mehta@example.com | rohit.verma@example.com");

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});