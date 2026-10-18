const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshSession = require("../models/RefreshSession");

const ACCESS_COOKIE = "shopora_access";
const REFRESH_COOKIE = "shopora_refresh";

function requireSecrets() {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    const error = new Error("Shopora authentication is not configured");
    error.code = "AUTH_NOT_CONFIGURED";
    throw error;
  }
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseDuration(value, fallbackMs) {
  const match = String(value || "").trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackMs;
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * units[match[2].toLowerCase()];
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function readCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, entry) => {
    const index = entry.indexOf("=");
    if (index < 0) return cookies;
    cookies[entry.slice(0, index).trim()] = decodeURIComponent(entry.slice(index + 1).trim());
    return cookies;
  }, {});
}

function safeUser(account) {
  const role = account.uid === process.env.SUPER_ADMIN_UID
    ? "super-admin"
    : account.uid === process.env.ADMIN_UID
      ? "admin"
      : account.role || "customer";
  return {
    uid: account.uid,
    name: account.name,
    displayName: account.name,
    username: account.username || null,
    email: account.email,
    photoURL: account.avatarUrl || "",
    avatarUrl: account.avatarUrl || "",
    role,
    providers: (account.providers || []).map((item) => item.provider),
  };
}

async function issueSession(res, account, req, existingSession = null) {
  requireSecrets();
  const accessTtl = process.env.JWT_ACCESS_TTL || "15m";
  const refreshTtl = process.env.JWT_REFRESH_TTL || "7d";
  const accessMaxAge = parseDuration(accessTtl, 15 * 60_000);
  const refreshMaxAge = parseDuration(refreshTtl, 7 * 86_400_000);
  const sessionId = existingSession?.sessionId || crypto.randomUUID();
  const role = safeUser(account).role;
  const accessToken = jwt.sign(
    { email: account.email, role, sessionId },
    process.env.JWT_ACCESS_SECRET,
    { subject: account.uid, expiresIn: accessTtl, issuer: "shopora", audience: "shopora-web" },
  );
  const refreshToken = jwt.sign(
    { sessionId, type: "refresh" },
    process.env.JWT_REFRESH_SECRET,
    {
      subject: account.uid,
      jwtid: crypto.randomUUID(),
      expiresIn: refreshTtl,
      issuer: "shopora",
      audience: "shopora-web",
    },
  );
  await RefreshSession.findOneAndUpdate(
    { sessionId },
    {
      userId: account.uid,
      sessionId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshMaxAge),
      lastUsedAt: new Date(),
      revokedAt: null,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(refreshMaxAge));
  return { sessionId, user: safeUser(account) };
}

function clearAuthCookies(res) {
  const options = cookieOptions(0);
  delete options.maxAge;
  res.clearCookie(ACCESS_COOKIE, options);
  res.clearCookie(REFRESH_COOKIE, options);
}

function verifyAccess(token) {
  requireSecrets();
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: "shopora", audience: "shopora-web" });
}

function verifyRefresh(token) {
  requireSecrets();
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer: "shopora", audience: "shopora-web" });
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  hashToken,
  issueSession,
  readCookies,
  requireSecrets,
  safeUser,
  verifyAccess,
  verifyRefresh,
};
