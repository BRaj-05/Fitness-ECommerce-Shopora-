import { useEffect } from "react";

const DEFAULT_TITLE = "Shopora | Fitness Gear, Nutrition & Training";
const DEFAULT_DESCRIPTION =
  "Shop fitness gear, performance nutrition and recovery essentials alongside practical training plans and health tools.";
const EMPTY_SCHEMAS = [];

function absoluteUrl(value, siteUrl) {
  if (!value) return siteUrl;
  try {
    return new URL(value, `${siteUrl}/`).toString();
  } catch {
    return siteUrl;
  }
}

function setMeta(selector, attribute, value) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  Object.entries(attribute).forEach(([key, content]) => node.setAttribute(key, content));
  node.setAttribute("content", value);
}

export default function SEOHead({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image = "/logo.png",
  type = "website",
  noindex = false,
  jsonLd = EMPTY_SCHEMAS,
}) {
  useEffect(() => {
    const siteUrl = String(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
    const path = canonicalPath || window.location.pathname;
    const canonical = absoluteUrl(path, siteUrl);
    const socialImage = absoluteUrl(image, siteUrl);

    document.title = title;
    setMeta('meta[name="description"]', { name: "description" }, description);
    setMeta('meta[name="robots"]', { name: "robots" }, noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large");
    setMeta('meta[property="og:title"]', { property: "og:title" }, title);
    setMeta('meta[property="og:description"]', { property: "og:description" }, description);
    setMeta('meta[property="og:url"]', { property: "og:url" }, canonical);
    setMeta('meta[property="og:image"]', { property: "og:image" }, socialImage);
    setMeta('meta[property="og:type"]', { property: "og:type" }, type);
    setMeta('meta[property="og:site_name"]', { property: "og:site_name" }, "Shopora");
    setMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    setMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    setMeta('meta[name="twitter:image"]', { name: "twitter:image" }, socialImage);

    let canonicalNode = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalNode) {
      canonicalNode = document.createElement("link");
      canonicalNode.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalNode);
    }
    canonicalNode.setAttribute("href", canonical);

    document.head.querySelectorAll('script[data-shopora-seo="true"]').forEach((node) => node.remove());
    const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    schemas.filter(Boolean).forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.shoporaSeo = "true";
      script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
      document.head.appendChild(script);
    });
  }, [canonicalPath, description, image, jsonLd, noindex, title, type]);

  return null;
}
