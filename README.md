# Shopora

`Train better. Shop smarter.`

Shopora is a full-stack fitness commerce and digital performance application. It combines a 40-product MongoDB catalog, reserved-stock carts, verified Razorpay payments, memberships, rewards, fitness tools, workout tracking, and a secure operations console.

Repository: https://github.com/BRaj-05/Fitness-ECommerce-Shopora-

## Features

- Shopora-owned MongoDB identities with local username/email login
- bcrypt password hashing, Google OAuth 2.0, and GitHub OAuth 2.0
- Short-lived JWT access sessions and rotating, revocable refresh sessions
- HttpOnly cookie storage with server-side authorization
- Product search, filtering, Quick Find, cart reservation, checkout, orders, and invoices
- Server-authoritative Razorpay product and membership verification
- Shopora Membership and Rewards multipliers
- Saved profiles and shipping addresses
- BMI/TDEE, calorie tools, fitness plans, and workout tracking
- Premium responsive light/dark customer and admin interfaces
- Admin product CRUD, restocking, Cloudinary upload, and server-side Pexels search

## Tech Stack

- React, Vite, Tailwind CSS
- Framer Motion, Recharts
- Node.js, Express
- MongoDB, Mongoose
- bcrypt, JSON Web Tokens
- Google OAuth 2.0, GitHub OAuth 2.0
- Razorpay, Cloudinary, Pexels API
- Jest, Supertest

The server retains an explicitly controlled Firebase Admin bearer-token fallback during staged migration. Set `ENABLE_LEGACY_FIREBASE_AUTH=false` after existing production identities have been migrated and verified. Firebase is not the primary Shopora browser session.

## Catalog And Images

The seeded catalog contains 40 products across protein powder, protein bars, shaker bottles, jump ropes, resistance bands, yoga mats, foam rollers, and fitness trackers. Availability remains:

`available = stock - reserved`

Reviewed local product photos and generated SVG fallbacks remain available. New admin products can use an uploaded Cloudinary image, a selected Pexels result imported by the server to Cloudinary, or an explicit image URL. Pexels attribution is shown at `/credits`.

See [docs/PRODUCT_IMAGES.md](docs/PRODUCT_IMAGES.md).

## Authentication

Shopora issues its own access JWT and rotating refresh session in secure HttpOnly cookies. Local passwords are stored only as bcrypt hashes. Verified Google and GitHub identities are linked by provider account ID or verified email; display names and usernames are never trusted for linking.

Existing `uid` values remain the stable Shopora internal user ID so carts, orders, profiles, addresses, memberships, rewards, and workouts remain attached.

See [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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

The client defaults to `http://localhost:5173`; the API defaults to `http://localhost:5000`. Copy the `.env.example` files and provide MongoDB plus the integrations you intend to test. Secrets belong only in local/deployment environment variables.

Run the auth migration in dry-run mode first:

```bash
cd server
npm run migrate:auth
node scripts/migrate-auth-to-shopora.js --apply
```

The migration never deletes data or rewrites commerce document user IDs.

## Payments And Admin

Product and membership amounts are chosen by the backend. Razorpay responses are accepted only after server-side signature verification. The dedicated admin login remains a separate signed HttpOnly session using `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.

## Project Structure

```text
client/     React application
server/     Express API, models, services, tests, migrations
docs/       Security and architecture documentation
scripts/    Catalog photo preparation data
```

## Creator

Shopora is developed and substantially customized by **Basant Raj**.

- LinkedIn: https://www.linkedin.com/in/raj-basant/
- GitHub: https://github.com/BRaj-05

## License

Shopora retains its MIT license and original license notice in `LICENSE`.
