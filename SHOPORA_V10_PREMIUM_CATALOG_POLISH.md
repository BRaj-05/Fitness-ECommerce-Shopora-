# SHOPORA V10 — PREMIUM COMMERCE POLISH + 40-PRODUCT CATALOG + UNIQUE PRODUCT ART
## Targeted post-V9.1 pass. Preserve all working auth/cart/checkout/payment/admin behavior.

> This is NOT another architecture rewrite.
> V8/V8.1/V9/V9.1 business logic is already working.
> V10 only improves:
> 1. header polish,
> 2. membership visual balance,
> 3. product catalog depth,
> 4. unique product imagery,
> 5. category discovery,
> 6. identity/readme truthfulness,
> 7. final visual consistency.
>
> Use exact supplied code/data whenever possible.
> Do not ask Codex to invent design.

---

# 0. NON-NEGOTIABLE PRESERVATION

Do NOT change:
- Firebase Google login
- MongoDB + bcrypt local login
- Firebase custom-token/session-refresh bridge
- admin UID authorization
- cart reservation API
- stock/reserved calculation
- address persistence
- server-authoritative checkout pricing
- PaymentSession
- Razorpay HMAC/order/payment verification
- paid order creation
- membership backend/payment logic
- rewards multiplier
- admin CRUD/restock APIs
- invoices
- LICENSE

Do NOT:
- reset/restore/clean working tree
- run destructive seed
- commit
- push
- expose env secrets
- install a new UI framework
- add another state-management library
- hotlink copyrighted ecommerce-brand images

---

# 1. FIRST: AUDIT IDENTITY AND TRUTHFUL CLAIMS

From repository root run:

```powershell
Get-ChildItem -Recurse -File |
  Where-Object {
    $_.FullName -notmatch "node_modules|\.git|dist|build"
  } |
  Select-String -Pattern "FitMart|Parth Narkar|parthbuilds|Gemini|FitnessChatBot|Mumbai|VESIT"
```

Rules:
- Outside `LICENSE`, remove stale original-project user-facing branding if any remains.
- Keep legitimate attribution/history where legally necessary.
- Do not rewrite LICENSE.
- Demo Mumbai locations may remain only if clearly documented as demo seed data; otherwise replace display copy with generic Delhi/NCR demo wording only if the seed is meant to be local-demo data.

Now search claims:

```powershell
Get-ChildItem README.md,docs -Recurse -File |
  Select-String -Pattern "wishlist|order tracking|real-time tracking|personalized AI"
```

If README claims a feature that has no actual route/component/API implementation:
- remove that claim.
- do not fake the feature merely to match README.

---

# 2. PRODUCT STRATEGY

Final catalog target:

```text
40 products total

Existing:
Protein Powder       5
Protein Bar          5
Jump Rope            5
Resistance Bands     5
Fitness Tracker      5

Add:
Yoga Mat             5
Foam Roller          5
Shaker Bottle        5
```

Final category grouping:

```text
Nutrition
  Protein Powder
  Protein Bar
  Shaker Bottle

Training Gear
  Jump Rope
  Resistance Bands
  Yoga Mat

Recovery
  Foam Roller

Wearables
  Fitness Tracker
```

Keep every seeded product in MongoDB.

DO NOT hard-code products into React.

---

# 3. CREATE UNIQUE PRODUCT ART GENERATOR

Create:

`client/scripts/generate-product-art.mjs`

Create exactly:

```js
import {
  mkdir,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

const OUT_DIR = path.resolve(
  process.cwd(),
  "public/products/generated",
);

const PRODUCTS = [
  // Existing 25
  ["1001", "Protein Powder", "CoreFuel Vanilla", "#FC5B45", "#182027"],
  ["1002", "Protein Powder", "CoreFuel Chocolate", "#8B5E3C", "#12171C"],
  ["1003", "Protein Powder", "PeakForm Strawberry", "#E75B71", "#21171A"],
  ["1004", "Protein Powder", "PureLift Cookies", "#D8CBB8", "#20242A"],
  ["1005", "Protein Powder", "Atlas Whey Mocha", "#A76C49", "#15191F"],

  ["1006", "Protein Bar", "PulseBar Cocoa", "#7A4438", "#18191D"],
  ["1007", "Protein Bar", "PulseBar Peanut", "#C89655", "#17191E"],
  ["1008", "Protein Bar", "LeanBite Berry", "#B94D69", "#17191E"],
  ["1009", "Protein Bar", "LiftBar Almond", "#D6B586", "#18191D"],
  ["1010", "Protein Bar", "FuelSquare Coffee", "#8C6252", "#15171A"],

  ["1011", "Jump Rope", "RopeRush Speed Pro", "#6657E8", "#10131A"],
  ["1012", "Jump Rope", "RopeRush Endurance", "#1A9D91", "#101419"],
  ["1013", "Jump Rope", "SwiftCord Beginner", "#EF7A3F", "#15171A"],
  ["1014", "Jump Rope", "AeroSkip Steel", "#607588", "#101419"],
  ["1015", "Jump Rope", "TempoRope Flex", "#D64A72", "#15151A"],

  ["1016", "Resistance Bands", "FlexForm Light", "#14A58D", "#101419"],
  ["1017", "Resistance Bands", "FlexForm Medium", "#6B5BE7", "#11131A"],
  ["1018", "Resistance Bands", "FlexForm Heavy", "#DE6841", "#171515"],
  ["1019", "Resistance Bands", "LoopSet Pro", "#D5A632", "#17191D"],
  ["1020", "Resistance Bands", "PowerBand Max", "#33404F", "#111319"],

  ["1021", "Fitness Tracker", "TrackOne Active", "#D7F34B", "#101319"],
  ["1022", "Fitness Tracker", "TrackOne Pulse", "#57BFEF", "#101319"],
  ["1023", "Fitness Tracker", "MoveSync Mini", "#F06D5B", "#121419"],
  ["1024", "Fitness Tracker", "MoveSync Pro", "#8C7CFF", "#111319"],
  ["1025", "Fitness Tracker", "VitaBand Core", "#5BD4B9", "#101319"],

  // New 15
  ["1026", "Yoga Mat", "GroundFlow Essential", "#A8B5A2", "#151917"],
  ["1027", "Yoga Mat", "GroundFlow Grip Pro", "#735F8F", "#151319"],
  ["1028", "Yoga Mat", "AlignMat Sand", "#D4B693", "#1A1714"],
  ["1029", "Yoga Mat", "AlignMat Sage", "#759987", "#121817"],
  ["1030", "Yoga Mat", "StudioBase Charcoal", "#444A50", "#111317"],

  ["1031", "Foam Roller", "RecoverRoll Soft", "#55AFA2", "#111817"],
  ["1032", "Foam Roller", "RecoverRoll Grid", "#596575", "#111319"],
  ["1033", "Foam Roller", "ReleaseCore Firm", "#C75A49", "#191414"],
  ["1034", "Foam Roller", "ReleaseCore Mini", "#7867CB", "#131219"],
  ["1035", "Foam Roller", "MobilityRoll Wave", "#CF9C4A", "#181613"],

  ["1036", "Shaker Bottle", "MixFlow 600", "#4B9DD2", "#101519"],
  ["1037", "Shaker Bottle", "MixFlow 750", "#1DA58A", "#101817"],
  ["1038", "Shaker Bottle", "HydraMix Smoke", "#5A646F", "#111318"],
  ["1039", "Shaker Bottle", "HydraMix Coral", "#E56A55", "#191312"],
  ["1040", "Shaker Bottle", "FuelBottle Frost", "#C9DFE7", "#15191A"],
];

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function powder(primary, dark, name) {
  return `
    <ellipse cx="400" cy="665" rx="190" ry="28" fill="#000" opacity=".13"/>
    <rect x="248" y="210" width="304" height="420" rx="62" fill="${dark}"/>
    <rect x="275" y="167" width="250" height="92" rx="30" fill="${primary}"/>
    <rect x="285" y="335" width="230" height="170" rx="26" fill="#F7F2E8"/>
    <path d="M310 430C360 370 430 485 492 405" fill="none" stroke="${primary}" stroke-width="23" stroke-linecap="round"/>
    <text x="400" y="386" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">SHOPORA</text>
    <text x="400" y="548" text-anchor="middle" font-size="22" font-weight="700" fill="#F7F2E8">${escapeXml(name)}</text>`;
}

function bar(primary, dark, name) {
  return `
    <ellipse cx="400" cy="600" rx="220" ry="24" fill="#000" opacity=".12"/>
    <g transform="rotate(-8 400 410)">
      <rect x="135" y="300" width="530" height="205" rx="48" fill="${dark}"/>
      <path d="M135 300h160l-85 205H135z" fill="${primary}"/>
      <rect x="520" y="300" width="145" height="205" rx="0" fill="${primary}" opacity=".72"/>
      <text x="410" y="390" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">SHOPORA</text>
      <text x="410" y="432" text-anchor="middle" font-size="19" font-weight="700" fill="#fff">${escapeXml(name)}</text>
    </g>`;
}

function rope(primary, dark, name) {
  return `
    <path d="M265 235c205-125 342 54 286 197-43 110-187 90-212-20-25-106 72-181 175-131"
      fill="none" stroke="${primary}" stroke-width="30" stroke-linecap="round"/>
    <rect x="188" y="190" width="72" height="190" rx="34" transform="rotate(-25 188 190)" fill="${dark}"/>
    <rect x="545" y="184" width="72" height="190" rx="34" transform="rotate(25 545 184)" fill="${dark}"/>
    <circle cx="400" cy="430" r="21" fill="${primary}" opacity=".75"/>
    <text x="400" y="620" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function bands(primary, dark, name) {
  return `
    <ellipse cx="400" cy="325" rx="240" ry="120" fill="none" stroke="${primary}" stroke-width="40"/>
    <ellipse cx="400" cy="414" rx="190" ry="92" fill="none" stroke="${dark}" stroke-width="35"/>
    <ellipse cx="400" cy="495" rx="140" ry="66" fill="none" stroke="${primary}" stroke-width="29" opacity=".66"/>
    <text x="400" y="640" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function tracker(primary, dark, name) {
  return `
    <rect x="342" y="110" width="116" height="210" rx="50" fill="${dark}"/>
    <rect x="292" y="270" width="216" height="260" rx="68" fill="${dark}"/>
    <rect x="318" y="300" width="164" height="198" rx="50" fill="#0B0E12" stroke="${primary}" stroke-width="7"/>
    <path d="M350 410h35l21-52 31 92 22-40h30"
      fill="none" stroke="${primary}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="342" y="485" width="116" height="210" rx="50" fill="${dark}"/>
    <text x="400" y="755" text-anchor="middle" font-size="26" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function mat(primary, dark, name) {
  return `
    <ellipse cx="405" cy="595" rx="260" ry="38" fill="#000" opacity=".12"/>
    <path d="M145 420c0-72 58-130 130-130h270c58 0 105 47 105 105v160H270c-69 0-125-56-125-125z" fill="${primary}"/>
    <ellipse cx="540" cy="446" rx="110" ry="110" fill="${dark}" opacity=".86"/>
    <ellipse cx="540" cy="446" rx="72" ry="72" fill="${primary}"/>
    <path d="M196 355h280" stroke="#fff" opacity=".45" stroke-width="8" stroke-linecap="round"/>
    <text x="400" y="690" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function roller(primary, dark, name) {
  return `
    <ellipse cx="405" cy="590" rx="235" ry="34" fill="#000" opacity=".12"/>
    <g transform="rotate(-15 400 420)">
      <rect x="180" y="315" width="440" height="210" rx="102" fill="${dark}"/>
      ${Array.from({length: 7}).map((_, i) =>
        `<path d="M${230+i*53} 330v180" stroke="${primary}" stroke-width="22" stroke-linecap="round" opacity="${0.55 + (i%3)*0.15}"/>`
      ).join("")}
      <ellipse cx="610" cy="420" rx="70" ry="92" fill="${primary}"/>
      <ellipse cx="610" cy="420" rx="34" ry="48" fill="${dark}"/>
    </g>
    <text x="400" y="690" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function shaker(primary, dark, name) {
  return `
    <ellipse cx="400" cy="648" rx="150" ry="30" fill="#000" opacity=".12"/>
    <path d="M290 260h220l-24 340c-3 42-37 74-79 74h-14c-42 0-76-32-79-74l-24-340z" fill="${primary}"/>
    <rect x="270" y="190" width="260" height="95" rx="30" fill="${dark}"/>
    <rect x="325" y="130" width="150" height="86" rx="24" fill="${dark}"/>
    <path d="M335 430c45-38 90 39 132-10" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".78"/>
    <text x="400" y="355" text-anchor="middle" font-size="28" font-weight="800" fill="${dark}">SHOPORA</text>
    <text x="400" y="742" text-anchor="middle" font-size="27" font-weight="800" fill="${dark}">${escapeXml(name)}</text>`;
}

function bodyFor(type, primary, dark, name) {
  if (type === "Protein Powder") return powder(primary, dark, name);
  if (type === "Protein Bar") return bar(primary, dark, name);
  if (type === "Jump Rope") return rope(primary, dark, name);
  if (type === "Resistance Bands") return bands(primary, dark, name);
  if (type === "Fitness Tracker") return tracker(primary, dark, name);
  if (type === "Yoga Mat") return mat(primary, dark, name);
  if (type === "Foam Roller") return roller(primary, dark, name);
  return shaker(primary, dark, name);
}

await mkdir(OUT_DIR, {
  recursive: true,
});

for (const [
  id,
  type,
  name,
  primary,
  dark,
] of PRODUCTS) {
  const bg =
    Number(id) % 2 === 0
      ? "#F1ECE3"
      : "#E9EEF2";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800"
  xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="0" cy="0" r="1"
      gradientUnits="userSpaceOnUse"
      gradientTransform="translate(180 160) rotate(46) scale(760)">
      <stop stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="${bg}"/>
    </radialGradient>
  </defs>

  <rect width="800" height="800" rx="54" fill="url(#bg)"/>

  <circle cx="690" cy="95" r="42" fill="${primary}" opacity=".16"/>
  <circle cx="105" cy="690" r="82" fill="${primary}" opacity=".09"/>

  ${bodyFor(type, primary, dark, name)}

  <text x="55" y="70"
    font-family="Arial, sans-serif"
    font-size="16"
    font-weight="800"
    letter-spacing="4"
    fill="${dark}"
    opacity=".54">${type.toUpperCase()}</text>

  <text x="745" y="70"
    text-anchor="end"
    font-family="Arial, sans-serif"
    font-size="16"
    font-weight="800"
    letter-spacing="2"
    fill="${dark}"
    opacity=".38">#${id}</text>
</svg>`;

  await writeFile(
    path.join(
      OUT_DIR,
      `${id}.svg`,
    ),
    svg,
    "utf8",
  );
}

console.log(
  `Generated ${PRODUCTS.length} unique Shopora product images in ${OUT_DIR}`,
);
```

This guarantees:
- 40 product image files
- every product gets a distinct local image
- no image hotlink breakage
- no third-party product-logo copyright issue
- each image is a real image asset loaded by the browser, not an emoji placeholder

---

# 4. ADD SCRIPT COMMAND

Patch `client/package.json`.

Inside `scripts`, add:

```json
"generate:product-art": "node scripts/generate-product-art.mjs"
```

Do not remove any existing scripts.

Run:

```powershell
cd client
npm run generate:product-art
cd ..
```

Verify:

```powershell
(Get-ChildItem "client/public/products/generated/*.svg").Count
```

Expected:

```text
40
```

---

# 5. ADD 15 NEW MONGODB SEED PRODUCTS

Open the CURRENT safe catalog seed:

```text
server/seedShoporaCatalog.js
```

Preserve its existing 25 entries and existing upsert/non-destructive behavior.

Append these exact 15 products, adapting only property spelling if the CURRENT existing 25 use a slightly different exact key name.

Use the same schema keys as the existing 25:

```js
{
  productId: 1026,
  name: "GroundFlow Yoga Mat Essential",
  brand: "GroundFlow",
  type: "Yoga Mat",
  category: "Training Gear",
  price: 899,
  originalPrice: 1099,
  stock: 28,
  reserved: 0,
  rating: 4.5,
  reviewCount: 86,
  badge: "BEGINNER PICK",
  description:
    "Comfort-focused training mat for stretching, mobility and everyday floor sessions.",
  highlights: [
    "Textured non-slip surface",
    "Comfort cushioning",
    "Easy roll-up storage",
  ],
  image: "/products/generated/1026.svg",
},
{
  productId: 1027,
  name: "GroundFlow Yoga Mat Grip Pro",
  brand: "GroundFlow",
  type: "Yoga Mat",
  category: "Training Gear",
  price: 1499,
  originalPrice: 1799,
  stock: 19,
  reserved: 0,
  rating: 4.7,
  reviewCount: 121,
  badge: "PRO GRIP",
  description:
    "High-grip mat built for strength, yoga, mobility and high-sweat training sessions.",
  highlights: [
    "High-grip top layer",
    "Dense supportive base",
    "Alignment guide",
  ],
  image: "/products/generated/1027.svg",
},
{
  productId: 1028,
  name: "AlignMat Sand Comfort",
  brand: "AlignMat",
  type: "Yoga Mat",
  category: "Training Gear",
  price: 1199,
  originalPrice: 1399,
  stock: 24,
  reserved: 0,
  rating: 4.4,
  reviewCount: 74,
  badge: "COMFORT",
  description:
    "Soft neutral-tone mat designed for recovery sessions, stretching and home workouts.",
  highlights: [
    "Soft-touch finish",
    "Balanced cushioning",
    "Easy-clean surface",
  ],
  image: "/products/generated/1028.svg",
},
{
  productId: 1029,
  name: "AlignMat Sage Stability",
  brand: "AlignMat",
  type: "Yoga Mat",
  category: "Training Gear",
  price: 1299,
  originalPrice: 1549,
  stock: 22,
  reserved: 0,
  rating: 4.6,
  reviewCount: 93,
  badge: "STABLE",
  description:
    "Stable training mat with a grounded base for mobility, bodyweight and yoga routines.",
  highlights: [
    "Anti-slide underside",
    "Stable medium-density foam",
    "Portable roll design",
  ],
  image: "/products/generated/1029.svg",
},
{
  productId: 1030,
  name: "StudioBase Yoga Mat Charcoal",
  brand: "StudioBase",
  type: "Yoga Mat",
  category: "Training Gear",
  price: 1699,
  originalPrice: 1999,
  stock: 16,
  reserved: 0,
  rating: 4.8,
  reviewCount: 147,
  badge: "STUDIO",
  description:
    "Premium dense mat for regular strength, mobility and yoga practice.",
  highlights: [
    "Premium dense foam",
    "Grip-focused finish",
    "Durable edge construction",
  ],
  image: "/products/generated/1030.svg",
},

{
  productId: 1031,
  name: "RecoverRoll Foam Roller Soft",
  brand: "RecoverRoll",
  type: "Foam Roller",
  category: "Recovery",
  price: 699,
  originalPrice: 899,
  stock: 31,
  reserved: 0,
  rating: 4.4,
  reviewCount: 69,
  badge: "RECOVERY",
  description:
    "Gentle foam roller for warm-ups, recovery days and beginner mobility work.",
  highlights: [
    "Soft-density foam",
    "Full-body recovery size",
    "Lightweight core",
  ],
  image: "/products/generated/1031.svg",
},
{
  productId: 1032,
  name: "RecoverRoll Grid Pro",
  brand: "RecoverRoll",
  type: "Foam Roller",
  category: "Recovery",
  price: 999,
  originalPrice: 1199,
  stock: 23,
  reserved: 0,
  rating: 4.7,
  reviewCount: 112,
  badge: "DEEP TISSUE",
  description:
    "Textured recovery roller designed for controlled pressure and post-training mobility.",
  highlights: [
    "Multi-zone texture",
    "Rigid inner core",
    "Medium-firm density",
  ],
  image: "/products/generated/1032.svg",
},
{
  productId: 1033,
  name: "ReleaseCore Foam Roller Firm",
  brand: "ReleaseCore",
  type: "Foam Roller",
  category: "Recovery",
  price: 1099,
  originalPrice: 1349,
  stock: 18,
  reserved: 0,
  rating: 4.6,
  reviewCount: 97,
  badge: "FIRM",
  description:
    "Firm recovery roller for athletes who prefer stronger pressure after demanding sessions.",
  highlights: [
    "Firm-density shell",
    "Stable hollow core",
    "Targeted pressure zones",
  ],
  image: "/products/generated/1033.svg",
},
{
  productId: 1034,
  name: "ReleaseCore Mini Roller",
  brand: "ReleaseCore",
  type: "Foam Roller",
  category: "Recovery",
  price: 549,
  originalPrice: 699,
  stock: 34,
  reserved: 0,
  rating: 4.3,
  reviewCount: 58,
  badge: "TRAVEL",
  description:
    "Compact roller for calves, forearms and targeted recovery at home or while travelling.",
  highlights: [
    "Compact portable format",
    "Textured surface",
    "Targeted muscle use",
  ],
  image: "/products/generated/1034.svg",
},
{
  productId: 1035,
  name: "MobilityRoll Wave",
  brand: "MobilityRoll",
  type: "Foam Roller",
  category: "Recovery",
  price: 1299,
  originalPrice: 1499,
  stock: 15,
  reserved: 0,
  rating: 4.8,
  reviewCount: 136,
  badge: "POPULAR",
  description:
    "Wave-textured premium recovery roller for mobility sessions and post-workout release.",
  highlights: [
    "Wave texture pattern",
    "Balanced firm support",
    "High-durability core",
  ],
  image: "/products/generated/1035.svg",
},

{
  productId: 1036,
  name: "MixFlow Shaker Bottle 600",
  brand: "MixFlow",
  type: "Shaker Bottle",
  category: "Nutrition",
  price: 349,
  originalPrice: 449,
  stock: 48,
  reserved: 0,
  rating: 4.4,
  reviewCount: 155,
  badge: "EVERYDAY",
  description:
    "Compact shaker bottle for protein, hydration and everyday gym sessions.",
  highlights: [
    "600 ml capacity",
    "Leak-resistant lid",
    "Mixing insert included",
  ],
  image: "/products/generated/1036.svg",
},
{
  productId: 1037,
  name: "MixFlow Shaker Bottle 750",
  brand: "MixFlow",
  type: "Shaker Bottle",
  category: "Nutrition",
  price: 449,
  originalPrice: 549,
  stock: 42,
  reserved: 0,
  rating: 4.6,
  reviewCount: 181,
  badge: "BEST VALUE",
  description:
    "Larger shaker for protein shakes, hydration and longer training sessions.",
  highlights: [
    "750 ml capacity",
    "Wide-mouth opening",
    "Leak-resistant cap",
  ],
  image: "/products/generated/1037.svg",
},
{
  productId: 1038,
  name: "HydraMix Shaker Smoke",
  brand: "HydraMix",
  type: "Shaker Bottle",
  category: "Nutrition",
  price: 499,
  originalPrice: 599,
  stock: 33,
  reserved: 0,
  rating: 4.5,
  reviewCount: 109,
  badge: "GYM PICK",
  description:
    "Smoked-finish shaker bottle with an easy-carry profile for daily training.",
  highlights: [
    "Easy-carry lid",
    "Measurement scale",
    "Rounded mixing base",
  ],
  image: "/products/generated/1038.svg",
},
{
  productId: 1039,
  name: "HydraMix Shaker Coral",
  brand: "HydraMix",
  type: "Shaker Bottle",
  category: "Nutrition",
  price: 499,
  originalPrice: 599,
  stock: 29,
  reserved: 0,
  rating: 4.5,
  reviewCount: 94,
  badge: "NEW",
  description:
    "Bright training shaker with secure closure and a smooth mixing profile.",
  highlights: [
    "Secure screw lid",
    "BPA-free body",
    "Easy-clean design",
  ],
  image: "/products/generated/1039.svg",
},
{
  productId: 1040,
  name: "FuelBottle Shaker Frost",
  brand: "FuelBottle",
  type: "Shaker Bottle",
  category: "Nutrition",
  price: 599,
  originalPrice: 749,
  stock: 26,
  reserved: 0,
  rating: 4.7,
  reviewCount: 128,
  badge: "PREMIUM",
  description:
    "Premium frosted shaker bottle for protein, supplements and hydration.",
  highlights: [
    "Frosted premium finish",
    "750 ml capacity",
    "Integrated mixing grid",
  ],
  image: "/products/generated/1040.svg",
},
```

IMPORTANT:
- preserve the existing non-destructive upsert behavior.
- do not delete user/admin-created products.
- if current IDs are strings, use strings consistently.
- if `Product` schema validates enum values for `type` or `category`, update those enums to include:
  - `Yoga Mat`
  - `Foam Roller`
  - `Shaker Bottle`
  - category `Recovery`

---

# 6. UPDATE EXISTING 25 SEED IMAGE PATHS

For existing seeded IDs 1001–1025, update only their `image` field:

```text
1001 -> /products/generated/1001.svg
...
1025 -> /products/generated/1025.svg
```

Do not change names/prices/stock unless the current values are clearly broken.

This ensures all 40 products have unique local image assets.

---

# 7. PRODUCT MODEL / VALIDATION SUPPORT

Inspect current:

```text
server/models/Product.js
server/validation/requestSchemas.js
server/routes/products.js
```

Only if enum validation exists, ensure these values are accepted:

```js
const PRODUCT_TYPES = [
  "Protein Powder",
  "Protein Bar",
  "Jump Rope",
  "Resistance Bands",
  "Fitness Tracker",
  "Yoga Mat",
  "Foam Roller",
  "Shaker Bottle",
];

const PRODUCT_CATEGORIES = [
  "Nutrition",
  "Training Gear",
  "Recovery",
  "Wearables",
];
```

Do not make product type/category free-form if the project currently validates them.

Admin create/edit must expose the new options.

---

# 8. RUN SAFE SEED

After syntax check:

```powershell
cd server
node --check seedShoporaCatalog.js
npm run seed:shopora
npm run smoke:shopora
cd ..
```

Target:
- >= 40 products
- existing non-seed user products preserved
- no duplicate productIds

Update smoke expectations only if it currently asserts exactly 25 products:
- change exact `25` to `>= 40`
- still assert at least 5 items for each original type
- additionally assert 5 Yoga Mat
- 5 Foam Roller
- 5 Shaker Bottle

---

# 9. CLASSIER HEADER WITHOUT REWRITING NAVBAR LOGIC

Do NOT replace Navbar authentication/cart/account logic.

Patch current Navbar JSX only enough to add these class hooks:

```text
shopora-topline
shopora-premium-header
shopora-premium-inner
shopora-wordmark
shopora-nav
shopora-nav-item
shopora-header-actions
```

Desktop content remains:

```text
Shopora
Shop
Fitness Plans
Health Tools
Tracker
More
Quick Find
Theme
Cart
Account
```

Add a subtle 2px gradient top line:

```jsx
<div className="shopora-topline" />
```

Header rules:
- transparent-black / graphite in dark
- ivory / slightly translucent in light
- blur on scroll
- active/nav hover has an elegant underline, not a filled pill
- Quick Find stays compact
- profile avatar has subtle ring
- no bright box around every control
- More dropdown behavior from V9 stays unchanged

Append CSS from section 14.

---

# 10. FILL THE MEMBERSHIP EMPTY SIDE

Observed problem:
- Membership pricing cards occupy the right side.
- Left side becomes a huge visually empty block.

Create:

`client/src/components/MembershipVisualPanel.jsx`

Create exactly:

```jsx
import {
  useNavigate,
} from "react-router-dom";

export default function MembershipVisualPanel({
  currentTier = "starter",
}) {
  const navigate =
    useNavigate();

  return (
    <aside className="membership-visual">
      <img
        src="/campaign/premium-gym.jpg"
        alt=""
        aria-hidden="true"
        className="membership-visual-image"
      />

      <div className="membership-visual-overlay" />

      <div className="membership-visual-content">
        <p className="membership-visual-eyebrow">
          SHOPORA MEMBERSHIP
        </p>

        <h2>
          Make every
          <br />
          session count.
        </h2>

        <p>
          Membership connects your
          training routine with enhanced
          Shopora Rewards and a clear
          30-day status.
        </p>

        <div className="membership-visual-stats">
          <div>
            <strong>
              Starter
            </strong>
            <span>
              1× rewards
            </span>
          </div>

          <div>
            <strong>
              Pro
            </strong>
            <span>
              1.25× rewards
            </span>
          </div>

          <div>
            <strong>
              Elite
            </strong>
            <span>
              1.5× rewards
            </span>
          </div>
        </div>

        <div className="membership-current">
          <span>
            Current tier
          </span>

          <strong>
            {String(
              currentTier,
            ).toUpperCase()}
          </strong>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/shop",
            )
          }
          className="membership-visual-cta"
        >
          Explore the store
          <span aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </aside>
  );
}
```

Patch `MembershipSection.jsx`.

Import:

```jsx
import MembershipVisualPanel from "./MembershipVisualPanel";
```

Use the CURRENT resolved membership tier/status variable.

Render membership section layout as:

```jsx
<div className="membership-editorial-grid">
  <MembershipVisualPanel
    currentTier={
      membership?.tier ||
      status?.tier ||
      "starter"
    }
  />

  <div className="membership-plan-side">
    {/* KEEP CURRENT plan cards and payment logic exactly here */}
  </div>
</div>
```

IMPORTANT:
- do not alter plan-purchase functions.
- do not alter Razorpay membership verification.
- do not alter status loading.
- if actual variable names differ, pass the currently resolved tier.
- left panel is purely visual.

On mobile:
- visual panel first
- plan cards below
- no horizontal scroll

---

# 11. SHOP CATEGORY DISCOVERY

Patch `ShopPage.jsx` without changing product fetching/search/sort logic.

Add category quick chips above current filter controls:

```jsx
const QUICK_TYPES = [
  "All",
  "Protein Powder",
  "Protein Bar",
  "Shaker Bottle",
  "Jump Rope",
  "Resistance Bands",
  "Yoga Mat",
  "Foam Roller",
  "Fitness Tracker",
];
```

Use current filter setter.

Do not create a second filter state if `typeFilter` already exists.

Visual:

```text
All | Protein Powder | Protein Bar | Shakers | Jump Ropes | Bands | Yoga | Recovery | Trackers
```

Allow horizontal scroll on mobile.

Product count should show total filtered count.

---

# 12. PRODUCT CARD IMAGE QUALITY

Patch `ProductVisual.jsx` only if necessary.

Desired behavior:

```text
product.image exists
  -> use image
  -> object-fit: contain for /products/generated/*.svg
  -> object-fit: cover for photographic uploads

image fails
  -> existing EditorialProductVisual fallback
```

Implementation pattern:

```jsx
const generated =
  String(product?.image || "")
    .includes(
      "/products/generated/",
    );

<img
  ...
  className={
    generated
      ? `h-full w-full object-contain p-4 ${className}`
      : `h-full w-full object-cover ${className}`
  }
/>
```

Do not remove Cloudinary support.

---

# 13. PREMIUM CATEGORY STRIP ON HOME/LANDING

If V9.1 `EditorialCampaignHome` exists, add a compact category ticker after trust strip:

```jsx
<div className="shopora-category-ticker">
  {[
    "Protein",
    "Training",
    "Recovery",
    "Hydration",
    "Wearables",
  ].map((item) => (
    <span key={item}>
      {item}
    </span>
  ))}
</div>
```

If the component does not exist, skip this section.
Do not rewrite the page to force it.

---

# 14. APPEND PREMIUM CSS TO `client/src/index.css`

Append exactly:

```css
/* =========================================================
   SHOPORA V10 — HEADER + MEMBERSHIP + CATALOG POLISH
   ========================================================= */

.shopora-topline {
  height: 2px;
  background:
    linear-gradient(
      90deg,
      #12bfa3 0%,
      #6e62ff 45%,
      #ff5c35 100%
    );
}

.shopora-premium-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom:
    1px solid var(--lux-line);
  background:
    color-mix(
      in srgb,
      var(--lux-bg) 88%,
      transparent
    );
  backdrop-filter:
    blur(18px)
    saturate(125%);
}

.dark .shopora-premium-header {
  background:
    rgba(
      7,
      8,
      10,
      0.86
    );
}

.shopora-premium-inner {
  width:
    min(
      1360px,
      calc(100% - 32px)
    );
  min-height: 74px;
  margin-inline: auto;
  display: grid;
  grid-template-columns:
    auto 1fr auto;
  align-items: center;
  gap: 26px;
}

.shopora-wordmark {
  font-weight: 850;
  letter-spacing:
    -0.035em;
}

.shopora-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.shopora-nav-item {
  position: relative;
  min-height: 44px;
  padding:
    0 12px;
  display: inline-flex;
  align-items: center;
  color:
    var(--lux-muted);
  font-size: 13px;
  font-weight: 750;
  transition:
    color 160ms ease;
}

.shopora-nav-item::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 6px;
  height: 2px;
  border-radius: 999px;
  background:
    linear-gradient(
      90deg,
      #12bfa3,
      #6e62ff
    );
  transform:
    scaleX(0);
  transform-origin:
    center;
  transition:
    transform 180ms ease;
}

.shopora-nav-item:hover,
.shopora-nav-item[aria-current="page"] {
  color:
    var(--lux-ink);
}

.shopora-nav-item:hover::after,
.shopora-nav-item[aria-current="page"]::after {
  transform:
    scaleX(1);
}

.shopora-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.membership-editorial-grid {
  width:
    min(
      1320px,
      calc(100% - 32px)
    );
  margin-inline: auto;
  display: grid;
  grid-template-columns:
    minmax(0, .88fr)
    minmax(520px, 1.12fr);
  gap: 18px;
  align-items: stretch;
}

.membership-visual {
  position: sticky;
  top: 98px;
  min-height: 720px;
  overflow: hidden;
  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .08
    );
  border-radius: 22px;
  background: #08090b;
  color: white;
}

.membership-visual-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter:
    saturate(.72)
    contrast(1.07);
}

.membership-visual-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(5,6,8,.22),
      rgba(5,6,8,.72) 58%,
      rgba(5,6,8,.96)
    );
}

.membership-visual-content {
  position: relative;
  z-index: 2;
  min-height: 720px;
  padding:
    clamp(
      28px,
      5vw,
      56px
    );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.membership-visual-eyebrow {
  font-size: 9px;
  font-weight: 850;
  letter-spacing:
    .20em;
  color:
    #69e3ce;
}

.membership-visual h2 {
  max-width: 520px;
  margin-top: 14px;
  font-family:
    var(
      --font-heading,
      "Manrope",
      sans-serif
    );
  font-size:
    clamp(
      3rem,
      5vw,
      5.5rem
    );
  line-height: .92;
  font-weight: 850;
  letter-spacing:
    -.055em;
}

.membership-visual > .membership-visual-content > p {
  max-width: 470px;
  margin-top: 22px;
  color:
    rgba(
      255,
      255,
      255,
      .59
    );
  font-size: 14px;
  line-height: 1.7;
}

.membership-visual-stats {
  display: grid;
  grid-template-columns:
    repeat(3, 1fr);
  margin-top: 34px;
  border-top:
    1px solid
    rgba(
      255,
      255,
      255,
      .15
    );
  border-bottom:
    1px solid
    rgba(
      255,
      255,
      255,
      .15
    );
}

.membership-visual-stats > div {
  padding:
    18px 14px 18px 0;
}

.membership-visual-stats > div +
div {
  padding-left: 14px;
  border-left:
    1px solid
    rgba(
      255,
      255,
      255,
      .15
    );
}

.membership-visual-stats strong,
.membership-visual-stats span {
  display: block;
}

.membership-visual-stats strong {
  font-size: 13px;
}

.membership-visual-stats span {
  margin-top: 5px;
  color:
    rgba(
      255,
      255,
      255,
      .42
    );
  font-size: 10px;
}

.membership-current {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 20px;
  color:
    rgba(
      255,
      255,
      255,
      .5
    );
  font-size: 10px;
  text-transform:
    uppercase;
  letter-spacing:
    .14em;
}

.membership-current strong {
  color: #fff;
}

.membership-visual-cta {
  width: fit-content;
  margin-top: 24px;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  border-radius: 10px;
  padding:
    0 18px;
  background: #fff;
  color: #0a0b0d;
  font-size: 12px;
  font-weight: 850;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.membership-visual-cta:hover {
  transform:
    translateY(-2px);
  background:
    #f2eee6;
}

.membership-plan-side {
  min-width: 0;
}

.shopora-category-ticker {
  overflow: hidden;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content:
    space-around;
  gap: 22px;
  border-top:
    1px solid
    var(--lux-line);
  border-bottom:
    1px solid
    var(--lux-line);
  background:
    var(--lux-surface);
}

.shopora-category-ticker span {
  white-space: nowrap;
  font-size: 11px;
  font-weight: 850;
  letter-spacing:
    .15em;
  text-transform:
    uppercase;
  color:
    var(--lux-muted);
}

.shopora-quick-types {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: none;
}

.shopora-quick-types::-webkit-scrollbar {
  display: none;
}

.shopora-quick-type {
  flex: 0 0 auto;
  min-height: 36px;
  border:
    1px solid
    var(--lux-line);
  border-radius: 999px;
  padding:
    0 14px;
  background:
    var(--lux-surface);
  color:
    var(--lux-muted);
  font-size: 11px;
  font-weight: 750;
  transition:
    color 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.shopora-quick-type:hover,
.shopora-quick-type-active {
  border-color:
    var(--lux-ink);
  background:
    var(--lux-ink);
  color:
    var(--lux-bg);
}

@media (
  max-width: 1100px
) {
  .membership-editorial-grid {
    grid-template-columns:
      1fr;
  }

  .membership-visual {
    position: relative;
    top: auto;
    min-height: 520px;
  }

  .membership-visual-content {
    min-height: 520px;
  }
}

@media (
  max-width: 767px
) {
  .shopora-premium-inner {
    width:
      min(
        100% - 20px,
        1360px
      );
    min-height: 66px;
    gap: 12px;
  }

  .membership-editorial-grid {
    width:
      min(
        100% - 24px,
        1320px
      );
  }

  .membership-visual {
    min-height: 460px;
  }

  .membership-visual-content {
    min-height: 460px;
    padding: 26px;
  }

  .membership-visual-stats {
    grid-template-columns:
      1fr;
  }

  .membership-visual-stats > div +
  div {
    padding-left: 0;
    border-left: 0;
    border-top:
      1px solid
      rgba(
        255,
        255,
        255,
        .12
      );
  }

  .shopora-category-ticker {
    justify-content:
      flex-start;
    overflow-x: auto;
    padding-inline: 18px;
  }
}
```

---

# 15. HEADER BRAND DETAIL

Keep the original V9 Shopora logo mark.

Do not replace it with any logo from reference screenshots.

If the current logo appears too tiny:
- BrandMark desktop: 36–40px
- wordmark: 19–21px
- header min-height: 74px

Do not exceed ~80px desktop header height.

---

# 16. ADMIN INVENTORY NEW TYPES

Patch current AdminInventory type/category dropdowns.

Product Type options must include:

```text
Protein Powder
Protein Bar
Shaker Bottle
Jump Rope
Resistance Bands
Yoga Mat
Foam Roller
Fitness Tracker
```

Category options:

```text
Nutrition
Training Gear
Recovery
Wearables
```

Keep image URL/upload control.

Generated seed SVG image paths are valid image paths and must render in admin preview.

---

# 17. README CATALOG UPDATE

Update README catalog text truthfully:

```md
### Store catalog

The included Shopora demo catalog contains 40 seeded products across:

- Protein Powder
- Protein Bar
- Shaker Bottle
- Jump Rope
- Resistance Bands
- Yoga Mat
- Foam Roller
- Fitness Tracker

Seeded catalog entries live in MongoDB and use unique local Shopora product artwork. Admin-created products can use local/remote URLs or the configured Cloudinary upload flow.

Inventory tracks total stock and reserved stock so customer-facing availability is derived from:

`available = stock - reserved`
```

Do not claim wishlist/order tracking unless actually implemented.

---

# 18. GITHUB REPO DESCRIPTION NOTE

DO NOT try to modify GitHub repository settings from source code.

At the end tell the user to manually verify GitHub repo description.

Recommended truthful description:

```text
Full-stack fitness e-commerce platform with MongoDB inventory, Firebase/Shopora authentication, Razorpay payments, memberships, fitness plans, health tools, invoices, rewards, and an admin operations dashboard.
```

Use this instead of claiming wishlist/order tracking unless those features truly exist.

---

# 19. VALIDATION — ONLY AFTER ALL EDITS

Run:

```powershell
cd client
npm run generate:product-art
npm run build
npm run lint

cd ../server
node --check seedShoporaCatalog.js
npm test
npm run seed:shopora
npm run smoke:shopora

cd ..
git diff --check
```

Then:

```powershell
Invoke-RestMethod "http://localhost:5000/api/products?all=true"
```

Confirm:
- at least 40 products
- each seeded 1001–1040 has non-empty image
- all local generated image paths are unique
- no duplicate productIds

Do not commit.
Do not push.

---

# 20. MANUAL ACCEPTANCE

Header:
- looks more premium than previous flat bar
- direct links stay visible
- More behavior remains stable
- Quick Find works
- theme works
- account/cart works

Membership:
- no giant blank left half
- left visual panel contains premium gym image + membership hierarchy
- current plan state still works
- membership payment still works

Shop:
- >=40 products
- 8 product types
- search works
- filters work
- sort works
- each seeded product has unique visual
- no broken external image dependency
- stock=0 remains visible and disabled
- Admin restock restores availability

Admin:
- new product types selectable
- Recovery category selectable
- product images preview
- stock edit still persists

---

# 21. RETURN ONLY

```text
SHOPORA V10 COMPLETE

Identity audit:
PASS / FAIL

README truthful:
PASS / FAIL

Header polish:
PASS / FAIL

More menu preserved:
PASS / FAIL

Membership empty-side fix:
PASS / FAIL

Membership purchase logic untouched:
PASS / FAIL

Unique generated product images:
<number>/40

MongoDB catalog:
<number> products

Protein Powder:
<number>

Protein Bar:
<number>

Shaker Bottle:
<number>

Jump Rope:
<number>

Resistance Bands:
<number>

Yoga Mat:
<number>

Foam Roller:
<number>

Fitness Tracker:
<number>

Recovery category:
PASS / FAIL

Shop filters:
PASS / FAIL

Admin new-type support:
PASS / FAIL

Admin stock/restock:
PASS / FAIL

Product image preview:
PASS / FAIL

Auth regression:
PASS / FAIL

Cart regression:
PASS / FAIL

Checkout regression:
PASS / FAIL

Razorpay regression:
PASS / FAIL

Client build:
PASS / FAIL

Client lint:
PASS / FAIL

Server tests:
PASS / FAIL

Shopora smoke:
PASS / FAIL

git diff --check:
PASS / FAIL

Manual GitHub description check:
REQUIRED / NOT REQUIRED
```
