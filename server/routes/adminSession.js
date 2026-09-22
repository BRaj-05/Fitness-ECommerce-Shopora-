const crypto = require("crypto");
const express = require("express");
const { COOKIE_NAME, configured, createSession, readSession, cookieOptions } = require("../middleware/adminSession");

const router = express.Router();

function equal(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post("/login", (req, res) => {
  if (!configured()) return res.status(503).json({ success: false, message: "Admin login is not configured" });
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const valid = equal(email, String(process.env.ADMIN_LOGIN_EMAIL).trim().toLowerCase()) &&
    equal(password, process.env.ADMIN_LOGIN_PASSWORD);
  if (!valid) return res.status(401).json({ success: false, message: "Invalid admin credentials" });

  res.cookie(COOKIE_NAME, createSession(email), cookieOptions());
  return res.json({ success: true });
});

router.get("/session", (req, res) => {
  const session = readSession(req);
  return res.json(session ? { authenticated: true, email: session.email } : { authenticated: false });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return res.json({ success: true });
});

module.exports = router;
