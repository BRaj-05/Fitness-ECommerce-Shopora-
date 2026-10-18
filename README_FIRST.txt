SHOPORA V11 REAL PHOTOS — DO THIS BEFORE CODEX

1) Copy/extract this package into the ROOT of your Shopora repository.
   It contains files already arranged under scripts/, server/, and client/.

2) Get a FREE Pexels API key:
   https://www.pexels.com/api/

3) From PowerShell in repo root, set the key only for this terminal session:

   $env:PEXELS_API_KEY="YOUR_PEXELS_KEY"

4) Run the improved photo selector/downloader yourself (this saves Codex tokens):

   node scripts/fetch-product-images.mjs

5) Open the review sheet:

   Start-Process "scripts/.image-review/index.html"

6) REVIEW ALL 40 PHOTOS.
   Reject any photo that has:
   - wrong product
   - visible Nike/Adidas/Apple/Fitbit/Garmin/etc. branding
   - awkward person/model composition
   - poor crop
   - obvious text/logo that makes it look like a third-party product

   Put bad Pexels IDs in:
   scripts/image-overrides.json

   Example:
   {
     "pin": {},
     "block": [1234567, 9876543]
   }

   Run the fetcher again after edits.

7) Confirm:

   (Get-ChildItem "client/public/products/real/*.jpg").Count

   It must be 40.

8) Clear the API key from the shell if you want:

   $env:PEXELS_API_KEY=$null

9) NOW give Codex only:

   Read SHOPORA_V11_REAL_PHOTOS_MIN_CODEX.md completely and execute it exactly.
   Use minimum-token execution mode. Do not browse the web. Do not redesign the app.
   The exact V11 files are already in their target paths. Integrate them only as instructed,
   preserve all auth/cart/stock/checkout/Razorpay/membership/admin logic, run the final checks,
   and return only the V11 status report.

IMPORTANT:
Never put PEXELS_API_KEY in client/.env, VITE_*, GitHub, README, or source code.
