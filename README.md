# Shopora

`Train better. Shop smarter.`

Shopora is a full-stack fitness commerce application built with React + Vite + Tailwind on the client and Node/Express on the server. It combines a product storefront, MongoDB-backed cart and stock reservation logic, Firebase Authentication with Google sign-in, Razorpay-verified payments, Shopora Membership, Shopora Rewards, fitness tools, plans, workouts and an admin dashboard.

Repository: https://github.com/BRaj-05/Shopora-fitness-commerce

## Features

- React + Vite + Tailwind storefront
- Node/Express API
- MongoDB data layer
- Firebase + Google sign-in
- Razorpay server verification for product checkout
- Shopora Membership with Razorpay-backed Pro and Elite tiers
- Shopora Rewards points and membership multipliers
- BMI/TDEE/calorie tools
- fitness plans/workouts
- light/dark theme
- premium admin dashboard
- searchable recent transactions
- invoice/print experience
- 30-second admin polling
- **Quick Find (`Ctrl/Cmd + K`)** - keyboard-first navigation across Shopora pages, fitness tools, plans and live products.

Quick Find uses a global keyboard shortcut, loads the product catalog lazily on first open, combines static navigation commands with live product matches, supports keyboard selection, and requires no additional UI dependency.

## Tech Stack

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

- React, Vite, Tailwind CSS
- Node.js, Express
- MongoDB, Mongoose
- Firebase Authentication and Firebase Admin SDK
- Razorpay
- Jest and Supertest

## Architecture

The React client talks to an Express API. Firebase handles user authentication on the client, while protected backend routes validate Firebase bearer tokens through Firebase Admin. MongoDB stores commerce, profile, rewards, workout and membership data.

Membership architecture:

```text
React MembershipSection
        ->
Firebase bearer token
        ->
POST /api/membership/create-order
        ->
Server chooses authoritative tier price
        ->
Razorpay order
        ->
Razorpay checkout
        ->
POST /api/membership/verify-payment
        ->
Server HMAC-SHA256 verification
        ->
Membership MongoDB document
        ->
Active 30-day status
        ->
Product purchases receive membership reward multiplier
```

## Local Setup

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` by default and the API runs on `http://localhost:5000`.

## Environment Variables

Use `client/.env.example` and `server/.env.example` as templates.

Required values for full local functionality:

- MongoDB URI
- Firebase web app config
- Firebase Admin credentials
- Razorpay key ID and key secret

Optional integrations:

- RapidAPI / ExerciseDB
- SMTP
- Cloudinary

The fitness-center seed file contains fictional Mumbai demo locations for local development; it is not production business identity data.

## Payment Flow

Product payments use Razorpay Checkout. The backend creates payment orders and verifies successful payments with Razorpay HMAC signatures before creating paid orders and clearing reserved cart stock.

Membership payments use separate Razorpay order and verification endpoints. The server determines the Pro and Elite prices from backend configuration and never trusts a client-supplied payment amount.

## Authentication Flow

Users can sign in with Google through Firebase Authentication or register a local Shopora account whose bcrypt password hash is stored in MongoDB. Local login accepts username or email, then exchanges a server-issued Firebase custom token for a Firebase-managed session. Protected backend routes require Firebase bearer tokens. If Firebase Admin credentials are missing in development, public APIs can still boot and protected routes fail safely with `503`.

## Project Structure

```text
client/
  src/
    auth/
    components/
    context/
    pages/
    utils/
server/
  config/
  middleware/
  models/
  routes/
  services/
  tests/
docs/
scripts/
```

## Author

**Basant Raj**

- GitHub: https://github.com/BRaj-05
- LinkedIn: https://www.linkedin.com/in/raj-basant/
- Project: https://github.com/BRaj-05/Shopora-fitness-commerce

## Acknowledgement

Shopora was developed by extending an MIT-licensed open-source foundation and then substantially redesigned and expanded. See `LICENSE` for the retained license notice.

## License

This project is licensed under the MIT License.
