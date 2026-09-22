const crypto = require("crypto");

const COOKIE_NAME = "shopora_admin_session";
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

function configured() {
  return Boolean(
    process.env.ADMIN_LOGIN_EMAIL &&
    process.env.ADMIN_LOGIN_PASSWORD &&
    process.env.ADMIN_SESSION_SECRET,
  );
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(value).digest("base64url");
}

function createSession(email) {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + MAX_AGE_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  if (!process.env.ADMIN_SESSION_SECRET) return null;
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_MS,
    path: "/",
  };
}

function requireAdminSession(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  req.adminSession = session;
  next();
}

module.exports = { COOKIE_NAME, configured, createSession, readSession, cookieOptions, requireAdminSession };
