const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Product = require("../models/Product");
const imageMap = require("../../scripts/product-image-map.json");

const APPLY = process.argv.includes("--apply");

function isManagedImage(productId, currentImage) {
  const value = String(currentImage || "").trim();
  if (!value) return true;

  // Shopora-managed generated/real image paths are safe to refresh.
  if (value === `/products/generated/${productId}.svg`) return true;
  if (value.startsWith("/products/real/")) return true;

  // Preserve admin-selected Cloudinary/custom/local URLs.
  return false;
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  const entries = Object.entries(imageMap.images || {});
  if (entries.length < 40) {
    throw new Error(
      `product-image-map.json has only ${entries.length}/40 entries. Review/fetch all categories first.`,
    );
  }

  await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);

  const ids = entries.map(([id]) => Number(id));
  const products = await Product.find({ productId: { $in: ids } })
    .select("productId name image")
    .lean();

  const byId = new Map(products.map((product) => [Number(product.productId), product]));
  const rows = [];
  const operations = [];

  for (const [idText, info] of entries) {
    const productId = Number(idText);
    const product = byId.get(productId);

    if (!product) {
      rows.push({
        productId,
        product: "MISSING IN DB",
        before: "—",
        after: info.publicPath,
        action: "skip",
      });
      continue;
    }

    const canManage = isManagedImage(productId, product.image);
    const same = String(product.image || "") === String(info.publicPath || "");

    rows.push({
      productId,
      product: product.name,
      before: product.image || "(empty)",
      after: info.publicPath,
      action: same ? "unchanged" : canManage ? (APPLY ? "update" : "would update") : "preserve admin image",
    });

    if (APPLY && canManage && !same) {
      operations.push({
        updateOne: {
          filter: { productId },
          update: { $set: { image: info.publicPath } },
        },
      });
    }
  }

  console.table(rows);

  if (!APPLY) {
    console.log("\nDRY RUN ONLY. Re-run with --apply after reviewing the table.");
    return;
  }

  if (!operations.length) {
    console.log("\nNo managed product images need updating.");
    return;
  }

  const result = await Product.bulkWrite(operations, { ordered: false });
  console.log(`\nApplied ${result.modifiedCount || 0} product image updates.`);
}

main()
  .catch((error) => {
    console.error(`\nImage migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
