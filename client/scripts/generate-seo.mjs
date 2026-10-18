import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function envValue(name) {
  if (process.env[name]) return process.env[name];
  for (const filename of [".env.production", ".env"]) {
    const file = path.join(root, filename);
    if (!fs.existsSync(file)) continue;
    const match = fs.readFileSync(file, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, "");
  }
  return "";
}

const siteUrl = (envValue("VITE_SITE_URL") || "http://localhost:5173").replace(/\/$/, "");
const manifestPath = path.join(root, "public", "products", "real", "manifest.json");
let productIds = [];

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  productIds = Object.values(manifest.categories || {})
    .flat()
    .map((entry) => entry.productId)
    .filter(Boolean);
} catch {
  productIds = Array.from({ length: 40 }, (_, index) => 1001 + index);
}

const publicPaths = [
  "/",
  "/shop",
  "/plans/weight-loss",
  "/plans/muscle-building",
  "/plans/mobility-recovery",
  "/exercises",
  "/credits",
  "/privacy-policy",
  "/terms",
  ...productIds.map((id) => `/product/${id}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPaths.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth
Disallow: /checkout
Disallow: /payment
Disallow: /invoice/
Disallow: /profile
Disallow: /tracker
Disallow: /notes

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(root, "public", "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "public", "robots.txt"), robots);

