require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");
const {
  getSeedProductImage,
} = require("./config/productPhotoMap");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(
    "MONGO_URI missing in server/.env",
  );
  process.exit(1);
}

const products = [
  // ─────────────────────────────────────────────
  // PROTEIN POWDER — 5
  // ─────────────────────────────────────────────
  {
    productId: 1001,
    name: "CoreFuel Whey Protein Powder Vanilla",
    brand: "CoreFuel",
    category: "Nutrition",
    type: "Protein Powder",
    price: 2199,
    originalPrice: 2599,
    rating: 4.7,
    reviews: 184,
    badge: "Best Seller",
    image: "",
    stock: 72,
    reserved: 0,
    description:
      "A smooth vanilla whey protein powder designed for convenient post-workout protein intake.",
    highlights: [
      "24 g protein per serving",
      "Vanilla flavour",
      "Mixes easily with water or milk",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1002,
    name: "CoreFuel Whey Protein Powder Chocolate",
    brand: "CoreFuel",
    category: "Nutrition",
    type: "Protein Powder",
    price: 2299,
    originalPrice: 2699,
    rating: 4.8,
    reviews: 221,
    badge: "Popular",
    image: "",
    stock: 64,
    reserved: 0,
    description:
      "Chocolate whey protein powder with a rich cocoa-style flavour for training-day shakes.",
    highlights: [
      "24 g protein per serving",
      "Chocolate flavour",
      "Post-workout friendly",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1003,
    name: "PlantPeak Plant Protein Powder Cocoa",
    brand: "PlantPeak",
    category: "Nutrition",
    type: "Protein Powder",
    price: 1999,
    originalPrice: 2399,
    rating: 4.5,
    reviews: 96,
    badge: "Plant Based",
    image: "",
    stock: 48,
    reserved: 0,
    description:
      "A cocoa-flavoured plant protein powder for customers looking for a non-whey option.",
    highlights: [
      "Plant protein blend",
      "Cocoa flavour",
      "Dairy-free positioning",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1004,
    name: "CoreFuel Isolate Protein Powder Vanilla",
    brand: "CoreFuel",
    category: "Nutrition",
    type: "Protein Powder",
    price: 2899,
    originalPrice: 3299,
    rating: 4.9,
    reviews: 146,
    badge: "Premium",
    image: "",
    stock: 38,
    reserved: 0,
    description:
      "A premium vanilla protein isolate option positioned for customers wanting a lighter shake.",
    highlights: [
      "Protein isolate",
      "Vanilla flavour",
      "Premium line",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1005,
    name: "RecoverX Protein Powder Coffee",
    brand: "RecoverX",
    category: "Nutrition",
    type: "Protein Powder",
    price: 2499,
    originalPrice: 2899,
    rating: 4.6,
    reviews: 113,
    badge: "New",
    image: "",
    stock: 55,
    reserved: 0,
    description:
      "Coffee-flavoured protein powder built as a convenient shake option after demanding sessions.",
    highlights: [
      "Coffee flavour",
      "Training recovery positioning",
      "Easy shake format",
      "Demo Shopora catalog product",
    ],
  },

  // ─────────────────────────────────────────────
  // PROTEIN BAR — 5
  // ─────────────────────────────────────────────
  {
    productId: 1006,
    name: "LiftBite Protein Bar Chocolate Crunch",
    brand: "LiftBite",
    category: "Nutrition",
    type: "Protein Bar",
    price: 149,
    originalPrice: 179,
    rating: 4.6,
    reviews: 248,
    badge: "Best Seller",
    image: "",
    stock: 180,
    reserved: 0,
    description:
      "Chocolate crunch protein bar for a convenient snack between meals or after training.",
    highlights: [
      "Portable snack",
      "Chocolate crunch",
      "Individually packed",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1007,
    name: "LiftBite Protein Bar Peanut Butter",
    brand: "LiftBite",
    category: "Nutrition",
    type: "Protein Bar",
    price: 159,
    originalPrice: 189,
    rating: 4.7,
    reviews: 194,
    badge: "Popular",
    image: "",
    stock: 160,
    reserved: 0,
    description:
      "Peanut-butter-style protein bar with a dense snack texture.",
    highlights: [
      "Peanut butter flavour",
      "Portable snack",
      "Easy gym-bag option",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1008,
    name: "LiftBite Protein Bar Berry Almond",
    brand: "LiftBite",
    category: "Nutrition",
    type: "Protein Bar",
    price: 169,
    originalPrice: 199,
    rating: 4.4,
    reviews: 88,
    badge: null,
    image: "",
    stock: 145,
    reserved: 0,
    description:
      "Berry and almond flavoured protein bar for customers who prefer a fruit-and-nut profile.",
    highlights: [
      "Berry almond flavour",
      "Portable snack",
      "Individually packed",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1009,
    name: "FuelSquare Protein Bar Coffee Cocoa",
    brand: "FuelSquare",
    category: "Nutrition",
    type: "Protein Bar",
    price: 179,
    originalPrice: 209,
    rating: 4.5,
    reviews: 102,
    badge: "New",
    image: "",
    stock: 120,
    reserved: 0,
    description:
      "Coffee-cocoa protein bar with a dessert-inspired flavour profile.",
    highlights: [
      "Coffee cocoa flavour",
      "Compact snack",
      "Training-day convenience",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1010,
    name: "FuelSquare Protein Bar Salted Caramel",
    brand: "FuelSquare",
    category: "Nutrition",
    type: "Protein Bar",
    price: 179,
    originalPrice: 209,
    rating: 4.8,
    reviews: 175,
    badge: "Top Rated",
    image: "",
    stock: 132,
    reserved: 0,
    description:
      "Salted-caramel protein bar positioned as a convenient high-protein-style snack.",
    highlights: [
      "Salted caramel flavour",
      "Portable format",
      "Individually packed",
      "Demo Shopora catalog product",
    ],
  },

  // ─────────────────────────────────────────────
  // JUMP ROPE — 5
  // ─────────────────────────────────────────────
  {
    productId: 1011,
    name: "RopeRush Jump Rope Speed Pro",
    brand: "RopeRush",
    category: "Equipment",
    type: "Jump Rope",
    price: 699,
    originalPrice: 899,
    rating: 4.8,
    reviews: 203,
    badge: "Best Seller",
    image: "",
    stock: 85,
    reserved: 0,
    description:
      "A lightweight jump rope designed for quick cardio intervals and faster rotations.",
    highlights: [
      "Adjustable cable",
      "Lightweight handles",
      "Cardio training",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1012,
    name: "RopeRush Jump Rope Weighted Core",
    brand: "RopeRush",
    category: "Equipment",
    type: "Jump Rope",
    price: 999,
    originalPrice: 1199,
    rating: 4.6,
    reviews: 127,
    badge: "Strength Cardio",
    image: "",
    stock: 52,
    reserved: 0,
    description:
      "Weighted jump rope for customers who prefer more resistance during conditioning work.",
    highlights: [
      "Weighted rope",
      "Textured handles",
      "Conditioning focus",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1013,
    name: "AeroSkip Jump Rope Lite",
    brand: "AeroSkip",
    category: "Equipment",
    type: "Jump Rope",
    price: 449,
    originalPrice: 549,
    rating: 4.4,
    reviews: 83,
    badge: null,
    image: "",
    stock: 110,
    reserved: 0,
    description:
      "Entry-level lightweight jump rope for warm-ups, simple cardio sessions and beginners.",
    highlights: [
      "Beginner friendly",
      "Adjustable length",
      "Lightweight",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1014,
    name: "AeroSkip Jump Rope Endurance",
    brand: "AeroSkip",
    category: "Equipment",
    type: "Jump Rope",
    price: 799,
    originalPrice: 999,
    rating: 4.7,
    reviews: 134,
    badge: "Cardio Pick",
    image: "",
    stock: 70,
    reserved: 0,
    description:
      "A durable jump rope positioned for longer conditioning blocks and regular home workouts.",
    highlights: [
      "Durable cable",
      "Comfort grip",
      "Endurance sessions",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1015,
    name: "RopeRush Jump Rope Beginner Fit",
    brand: "RopeRush",
    category: "Equipment",
    type: "Jump Rope",
    price: 399,
    originalPrice: 499,
    rating: 4.3,
    reviews: 64,
    badge: "Starter",
    image: "",
    stock: 140,
    reserved: 0,
    description:
      "Simple adjustable jump rope for customers starting basic home cardio.",
    highlights: [
      "Simple adjustment",
      "Beginner focused",
      "Home workout friendly",
      "Demo Shopora catalog product",
    ],
  },

  // ─────────────────────────────────────────────
  // RESISTANCE BANDS — 5
  // ─────────────────────────────────────────────
  {
    productId: 1016,
    name: "FlexForm Resistance Bands Light Set",
    brand: "FlexForm",
    category: "Equipment",
    type: "Resistance Bands",
    price: 599,
    originalPrice: 749,
    rating: 4.6,
    reviews: 171,
    badge: "Popular",
    image: "",
    stock: 90,
    reserved: 0,
    description:
      "A light resistance bands set suited to warm-ups, mobility work and beginner strength sessions.",
    highlights: [
      "Multiple light resistances",
      "Portable pouch",
      "Warm-up friendly",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1017,
    name: "FlexForm Resistance Bands Power Set",
    brand: "FlexForm",
    category: "Equipment",
    type: "Resistance Bands",
    price: 1099,
    originalPrice: 1399,
    rating: 4.8,
    reviews: 212,
    badge: "Best Seller",
    image: "",
    stock: 58,
    reserved: 0,
    description:
      "Higher-resistance band set intended for assisted strength work and progressive home training.",
    highlights: [
      "Multiple resistance levels",
      "Strength focused",
      "Portable training",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1018,
    name: "MotionLoop Resistance Bands Fabric Set",
    brand: "MotionLoop",
    category: "Equipment",
    type: "Resistance Bands",
    price: 849,
    originalPrice: 999,
    rating: 4.7,
    reviews: 145,
    badge: "Comfort Pick",
    image: "",
    stock: 74,
    reserved: 0,
    description:
      "Fabric loop resistance bands designed for lower-body activation and compact workouts.",
    highlights: [
      "Fabric loops",
      "Three resistance levels",
      "Lower-body activation",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1019,
    name: "MotionLoop Resistance Bands Tube Kit",
    brand: "MotionLoop",
    category: "Equipment",
    type: "Resistance Bands",
    price: 1299,
    originalPrice: 1599,
    rating: 4.5,
    reviews: 111,
    badge: "Full Kit",
    image: "",
    stock: 46,
    reserved: 0,
    description:
      "Tube resistance bands kit with handles for a wider variety of home exercises.",
    highlights: [
      "Tube bands",
      "Handles included",
      "Multiple resistance levels",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1020,
    name: "FlexForm Resistance Bands Mobility Set",
    brand: "FlexForm",
    category: "Equipment",
    type: "Resistance Bands",
    price: 749,
    originalPrice: 899,
    rating: 4.6,
    reviews: 99,
    badge: "Mobility",
    image: "",
    stock: 81,
    reserved: 0,
    description:
      "Resistance bands set focused on mobility drills, stretching support and controlled activation.",
    highlights: [
      "Mobility focused",
      "Portable",
      "Multiple tensions",
      "Demo Shopora catalog product",
    ],
  },

  // ─────────────────────────────────────────────
  // FITNESS TRACKER — 5
  // ─────────────────────────────────────────────
  {
    productId: 1021,
    name: "PulseArc Fitness Tracker Mini",
    brand: "PulseArc",
    category: "Wearables",
    type: "Fitness Tracker",
    price: 2499,
    originalPrice: 2999,
    rating: 4.5,
    reviews: 118,
    badge: "New",
    image: "",
    stock: 44,
    reserved: 0,
    description:
      "Compact demo fitness tracker for step, activity and everyday workout tracking concepts.",
    highlights: [
      "Activity tracking",
      "Compact display",
      "Everyday wearable",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1022,
    name: "PulseArc Fitness Tracker Active 2",
    brand: "PulseArc",
    category: "Wearables",
    type: "Fitness Tracker",
    price: 3499,
    originalPrice: 3999,
    rating: 4.7,
    reviews: 156,
    badge: "Popular",
    image: "",
    stock: 39,
    reserved: 0,
    description:
      "Mid-range demo fitness tracker positioned for general activity and training sessions.",
    highlights: [
      "Activity modes",
      "Heart-rate-style demo positioning",
      "Daily wearable",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1023,
    name: "RunMetric Fitness Tracker Pro",
    brand: "RunMetric",
    category: "Wearables",
    type: "Fitness Tracker",
    price: 4999,
    originalPrice: 5699,
    rating: 4.8,
    reviews: 202,
    badge: "Premium",
    image: "",
    stock: 28,
    reserved: 0,
    description:
      "Premium demo fitness tracker positioned for runners and customers wanting more training metrics.",
    highlights: [
      "Running focused",
      "Multiple activity modes",
      "Premium line",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1024,
    name: "RunMetric Fitness Tracker Move Lite",
    brand: "RunMetric",
    category: "Wearables",
    type: "Fitness Tracker",
    price: 1999,
    originalPrice: 2399,
    rating: 4.3,
    reviews: 73,
    badge: "Starter",
    image: "",
    stock: 61,
    reserved: 0,
    description:
      "Entry-level demo activity tracker for simple daily movement tracking.",
    highlights: [
      "Entry-level wearable",
      "Simple activity tracking",
      "Lightweight design",
      "Demo Shopora catalog product",
    ],
  },
  {
    productId: 1025,
    name: "PulseArc Fitness Tracker Endurance",
    brand: "PulseArc",
    category: "Wearables",
    type: "Fitness Tracker",
    price: 4299,
    originalPrice: 4899,
    rating: 4.6,
    reviews: 137,
    badge: "Training Pick",
    image: "",
    stock: 33,
    reserved: 0,
    description:
      "Training-focused demo fitness tracker with an endurance-oriented product position.",
    highlights: [
      "Training focused",
      "Daily activity tracking",
      "Sport-style design",
      "Demo Shopora catalog product",
    ],
  },
  { productId: 1026, name: "GroundFlow Yoga Mat Essential", brand: "GroundFlow", type: "Yoga Mat", category: "Training Gear", price: 899, originalPrice: 1099, stock: 28, reserved: 0, rating: 4.5, reviews: 86, badge: "BEGINNER PICK", description: "Comfort-focused training mat for stretching, mobility and everyday floor sessions.", highlights: ["Textured non-slip surface", "Comfort cushioning", "Easy roll-up storage"], image: "/products/generated/1026.svg" },
  { productId: 1027, name: "GroundFlow Yoga Mat Grip Pro", brand: "GroundFlow", type: "Yoga Mat", category: "Training Gear", price: 1499, originalPrice: 1799, stock: 19, reserved: 0, rating: 4.7, reviews: 121, badge: "PRO GRIP", description: "High-grip mat built for strength, yoga, mobility and high-sweat training sessions.", highlights: ["High-grip top layer", "Dense supportive base", "Alignment guide"], image: "/products/generated/1027.svg" },
  { productId: 1028, name: "AlignMat Sand Comfort", brand: "AlignMat", type: "Yoga Mat", category: "Training Gear", price: 1199, originalPrice: 1399, stock: 24, reserved: 0, rating: 4.4, reviews: 74, badge: "COMFORT", description: "Soft neutral-tone mat designed for recovery sessions, stretching and home workouts.", highlights: ["Soft-touch finish", "Balanced cushioning", "Easy-clean surface"], image: "/products/generated/1028.svg" },
  { productId: 1029, name: "AlignMat Sage Stability", brand: "AlignMat", type: "Yoga Mat", category: "Training Gear", price: 1299, originalPrice: 1549, stock: 22, reserved: 0, rating: 4.6, reviews: 93, badge: "STABLE", description: "Stable training mat with a grounded base for mobility, bodyweight and yoga routines.", highlights: ["Anti-slide underside", "Stable medium-density foam", "Portable roll design"], image: "/products/generated/1029.svg" },
  { productId: 1030, name: "StudioBase Yoga Mat Charcoal", brand: "StudioBase", type: "Yoga Mat", category: "Training Gear", price: 1699, originalPrice: 1999, stock: 16, reserved: 0, rating: 4.8, reviews: 147, badge: "STUDIO", description: "Premium dense mat for regular strength, mobility and yoga practice.", highlights: ["Premium dense foam", "Grip-focused finish", "Durable edge construction"], image: "/products/generated/1030.svg" },
  { productId: 1031, name: "RecoverRoll Foam Roller Soft", brand: "RecoverRoll", type: "Foam Roller", category: "Recovery", price: 699, originalPrice: 899, stock: 31, reserved: 0, rating: 4.4, reviews: 69, badge: "RECOVERY", description: "Gentle foam roller for warm-ups, recovery days and beginner mobility work.", highlights: ["Soft-density foam", "Full-body recovery size", "Lightweight core"], image: "/products/generated/1031.svg" },
  { productId: 1032, name: "RecoverRoll Grid Pro", brand: "RecoverRoll", type: "Foam Roller", category: "Recovery", price: 999, originalPrice: 1199, stock: 23, reserved: 0, rating: 4.7, reviews: 112, badge: "DEEP TISSUE", description: "Textured recovery roller designed for controlled pressure and post-training mobility.", highlights: ["Multi-zone texture", "Rigid inner core", "Medium-firm density"], image: "/products/generated/1032.svg" },
  { productId: 1033, name: "ReleaseCore Foam Roller Firm", brand: "ReleaseCore", type: "Foam Roller", category: "Recovery", price: 1099, originalPrice: 1349, stock: 18, reserved: 0, rating: 4.6, reviews: 97, badge: "FIRM", description: "Firm recovery roller for athletes who prefer stronger pressure after demanding sessions.", highlights: ["Firm-density shell", "Stable hollow core", "Targeted pressure zones"], image: "/products/generated/1033.svg" },
  { productId: 1034, name: "ReleaseCore Mini Roller", brand: "ReleaseCore", type: "Foam Roller", category: "Recovery", price: 549, originalPrice: 699, stock: 34, reserved: 0, rating: 4.3, reviews: 58, badge: "TRAVEL", description: "Compact roller for calves, forearms and targeted recovery at home or while travelling.", highlights: ["Compact portable format", "Textured surface", "Targeted muscle use"], image: "/products/generated/1034.svg" },
  { productId: 1035, name: "MobilityRoll Wave", brand: "MobilityRoll", type: "Foam Roller", category: "Recovery", price: 1299, originalPrice: 1499, stock: 15, reserved: 0, rating: 4.8, reviews: 136, badge: "POPULAR", description: "Wave-textured premium recovery roller for mobility sessions and post-workout release.", highlights: ["Wave texture pattern", "Balanced firm support", "High-durability core"], image: "/products/generated/1035.svg" },
  { productId: 1036, name: "MixFlow Shaker Bottle 600", brand: "MixFlow", type: "Shaker Bottle", category: "Nutrition", price: 349, originalPrice: 449, stock: 48, reserved: 0, rating: 4.4, reviews: 155, badge: "EVERYDAY", description: "Compact shaker bottle for protein, hydration and everyday gym sessions.", highlights: ["600 ml capacity", "Leak-resistant lid", "Mixing insert included"], image: "/products/generated/1036.svg" },
  { productId: 1037, name: "MixFlow Shaker Bottle 750", brand: "MixFlow", type: "Shaker Bottle", category: "Nutrition", price: 449, originalPrice: 549, stock: 42, reserved: 0, rating: 4.6, reviews: 181, badge: "BEST VALUE", description: "Larger shaker for protein shakes, hydration and longer training sessions.", highlights: ["750 ml capacity", "Wide-mouth opening", "Leak-resistant cap"], image: "/products/generated/1037.svg" },
  { productId: 1038, name: "HydraMix Shaker Smoke", brand: "HydraMix", type: "Shaker Bottle", category: "Nutrition", price: 499, originalPrice: 599, stock: 33, reserved: 0, rating: 4.5, reviews: 109, badge: "GYM PICK", description: "Smoked-finish shaker bottle with an easy-carry profile for daily training.", highlights: ["Easy-carry lid", "Measurement scale", "Rounded mixing base"], image: "/products/generated/1038.svg" },
  { productId: 1039, name: "HydraMix Shaker Coral", brand: "HydraMix", type: "Shaker Bottle", category: "Nutrition", price: 499, originalPrice: 599, stock: 29, reserved: 0, rating: 4.5, reviews: 94, badge: "NEW", description: "Bright training shaker with secure closure and a smooth mixing profile.", highlights: ["Secure screw lid", "BPA-free body", "Easy-clean design"], image: "/products/generated/1039.svg" },
  { productId: 1040, name: "FuelBottle Shaker Frost", brand: "FuelBottle", type: "Shaker Bottle", category: "Nutrition", price: 599, originalPrice: 749, stock: 26, reserved: 0, rating: 4.7, reviews: 128, badge: "PREMIUM", description: "Premium frosted shaker bottle for protein, supplements and hydration.", highlights: ["Frosted premium finish", "750 ml capacity", "Integrated mixing grid"], image: "/products/generated/1040.svg" },
];

for (const product of products) {
  if (product.productId >= 1001 && product.productId <= 1040) {
    product.image = `/products/generated/${product.productId}.svg`;
  }
  if (product.category === "Equipment") product.category = "Training Gear";
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      ...(process.env.MONGO_DB
        ? { dbName: process.env.MONGO_DB }
        : {}),
    });

    const operations = products.map((product) => {
      const seededProduct = {
        ...product,
        image: getSeedProductImage(product.productId) || product.image,
      };
      const { reserved, ...catalogFields } = seededProduct;

      return { updateOne: {
        filter: {
          productId: product.productId,
        },
        update: {
          $set: catalogFields,
          $setOnInsert: { reserved },
        },
        upsert: true,
      } };
    });

    const result = await Product.bulkWrite(
      operations,
      {
        ordered: true,
      },
    );

    console.log(
      `Shopora catalog ready: ${products.length} demo products`,
    );

    console.log({
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    });

    try {
      const cache = require("./lib/cache");
      await cache?.clearAll?.();
    } catch {
      // Redis/cache is optional.
    }
  } catch (error) {
    console.error(
      "Shopora catalog seed failed:",
      error,
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
