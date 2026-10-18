# Shopora Architecture

```text
React / Vite
     ->
Express
     |-- Auth
     |    |-- Local / bcrypt
     |    |-- Google OAuth
     |    |-- GitHub OAuth
     |    `-- JWT sessions
     |
     |-- Products
     |    |-- MongoDB
     |    |-- Pexels search
     |    `-- Cloudinary storage
     |
     |-- Cart / Inventory
     |-- Orders
     |-- Razorpay
     |-- Membership
     |-- Rewards
     `-- Admin
```

MongoDB is authoritative for identities, product stock, reservations, profiles, addresses, orders, memberships, rewards, and workouts. The browser authenticates with HttpOnly cookies. Product and membership prices are recalculated server-side before Razorpay orders are created and verified.

Admin credentials and the dedicated admin session secret remain server-only. Admin product photo search is also server-side so the Pexels key is never exposed to the browser.
