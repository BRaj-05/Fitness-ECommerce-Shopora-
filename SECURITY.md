# Shopora Security Policy

Shopora contains authentication, user profile data, cart and order data, membership state, and Razorpay payment flows. Security-sensitive actions are expected to be validated on the server.

## Supported Version

Security fixes apply to the latest `main` branch.

## Reporting a Vulnerability

Do not publish exploit details, secrets, tokens, or private user information in a normal GitHub issue.

Preferred contact:

- GitHub profile: https://github.com/BRaj-05
- LinkedIn: https://www.linkedin.com/in/raj-basant/

If GitHub private vulnerability reporting is enabled for the repository, prefer that channel.

## Authentication

- Firebase Authentication handles user authentication.
- Firebase Admin verifies protected API tokens on the server.
- Protected APIs must validate ownership against the verified Firebase UID.
- Admin authorization must be enforced on the backend, not only hidden in the UI.

## Payments

- Razorpay payment signatures are verified server-side using HMAC-SHA256.
- `RAZORPAY_KEY_SECRET` must never be exposed to React.
- Payment success must never be trusted only because the browser says it succeeded.
- Demo payment routes must stay disabled in production.

## Membership

- Membership prices are controlled by the backend.
- Paid membership is activated only after verified payment.
- Membership ownership must match the authenticated user.
- Development membership simulation must not work in production.

## Cart and Inventory

- Quantity and stock changes must be validated server-side.
- Reservation logic must prevent negative reservations and overselling.
- Final order state must use trusted database values.

## Secrets

Real `.env` files must not be committed.

Never expose:

- Firebase Admin private key
- Razorpay secret
- MongoDB URI
- SMTP password
- Cloudinary API secret

Browser-safe `VITE_*` configuration is not a replacement for server secrets.

If a secret is accidentally committed, rotate it immediately.

## Production Checklist

Before production:

- configure MongoDB securely
- configure Firebase web and Admin credentials
- configure Razorpay production credentials
- set production CORS origins
- confirm demo endpoints return 404
- confirm `.env` files are ignored
- run client build and lint
- run server tests
- test authentication ownership checks
- test rejection of an invalid payment signature

## AI

Shopora does not use retired chatbot integrations.
