const streamifier = require("streamifier");
const cloudinary = require("../lib/cloudinary");

function configured() {
  return Boolean(process.env.PEXELS_API_KEY);
}

function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function normalizePhoto(photo) {
  return {
    pexelsId: String(photo.id),
    previewUrl: photo.src?.medium || photo.src?.small || "",
    imageUrl: photo.src?.large2x || photo.src?.large || photo.src?.original || "",
    photographer: photo.photographer || "",
    photographerUrl: photo.photographer_url || "",
    pexelsUrl: photo.url || "",
    alt: photo.alt || "Product photo",
  };
}

async function searchPhotos(query, perPage = 6) {
  if (!configured()) {
    const error = new Error("Pexels image search is not configured");
    error.code = "PEXELS_NOT_CONFIGURED";
    throw error;
  }
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(Math.min(12, Math.max(1, perPage))));
  url.searchParams.set("orientation", "square");
  const response = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } });
  if (!response.ok) throw new Error("Pexels image search is temporarily unavailable");
  const payload = await response.json();
  return (payload.photos || []).map(normalizePhoto).filter((photo) => photo.imageUrl);
}

async function importToCloudinary(imageUrl, productId) {
  if (!cloudinaryConfigured()) return null;
  const parsed = new URL(imageUrl);
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith("pexels.com")) {
    throw new Error("Selected photo is not a trusted Pexels image");
  }
  const response = await fetch(parsed);
  if (!response.ok) throw new Error("Unable to download selected Pexels image");
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 10 * 1024 * 1024) throw new Error("Selected Pexels image is too large");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Selected Pexels image is too large");
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "shopora/products", public_id: `product-${productId}-${Date.now()}`, resource_type: "image" },
      (error, uploaded) => error ? reject(error) : resolve(uploaded),
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
  return result.secure_url;
}

function buildSearchQuery(product) {
  return [product.name, product.type, product.category, "fitness product"].filter(Boolean).join(" ");
}

module.exports = { buildSearchQuery, configured, importToCloudinary, searchPhotos };
