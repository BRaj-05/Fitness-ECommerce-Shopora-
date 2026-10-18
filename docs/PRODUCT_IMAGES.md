# Product Images

## Seeded Products

The 40 seeded products use reviewed local photography from `client/public/products/real/`. The manifest records Pexels attribution, and generated Shopora SVG artwork remains available as a fallback.

## New Admin Product

```text
Upload
  -> Cloudinary
  -> Product.image

or

Pexels Search
  -> Admin select / optional auto-select
  -> server download
  -> Cloudinary
  -> Product.image
  -> imageCredit metadata
```

An explicit HTTPS image URL is also supported. Priority is admin upload, selected Pexels, optional auto-Pexels, then the existing Shopora fallback.

If Cloudinary is unavailable, a selected Pexels HTTPS URL and attribution metadata are persisted. If Pexels is unavailable, product creation can continue with the supplied image or fallback. Runtime product creation never writes into `client/public`.

`PEXELS_API_KEY` is server-only. It must never use a `VITE_` prefix or appear in API responses, documentation values, or committed environment files.
