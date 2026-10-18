const admin = require("../firebaseAdmin");
const crypto = require("crypto");
const AuthUser = require("../models/AuthUser");
const RefreshSession = require("../models/RefreshSession");
const { ACCESS_COOKIE, REFRESH_COOKIE, hashToken, issueSession, readCookies, verifyAccess, verifyRefresh } = require("../lib/authTokens");

const legacyEnabled = () => process.env.ENABLE_LEGACY_FIREBASE_AUTH !== "false";

async function authenticate(req, res) {
  const cookies = readCookies(req);
  const accessToken = cookies[ACCESS_COOKIE];
  if (accessToken) {
    try {
      const decoded = verifyAccess(accessToken);
      return {
        uid: decoded.sub,
        email: decoded.email || null,
        role: decoded.role || "customer",
        sessionId: decoded.sessionId,
        authProvider: "shopora",
      };
    } catch (error) {
      if (error.code === "AUTH_NOT_CONFIGURED") throw error;
    }
  }

  if (cookies[REFRESH_COOKIE] && res) {
    try {
      const decoded = verifyRefresh(cookies[REFRESH_COOKIE]);
      const session = await RefreshSession.findOne({ sessionId: decoded.sessionId }).select("+refreshTokenHash");
      const supplied = Buffer.from(hashToken(cookies[REFRESH_COOKIE]), "hex");
      const stored = Buffer.from(session?.refreshTokenHash || "", "hex");
      const valid = session && !session.revokedAt && session.expiresAt > new Date() && supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
      if (valid) {
        const account = await AuthUser.findOne({ uid: decoded.sub });
        if (account) {
          const rotated = await issueSession(res, account, req, session);
          return { uid: account.uid, email: account.email, role: rotated.user.role, sessionId: rotated.sessionId, authProvider: "shopora" };
        }
      }
    } catch {}
  }

  const authHeader = req.headers.authorization;
  if (!legacyEnabled() || !authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (process.env.NODE_ENV !== "production" && token.startsWith("dev:")) {
    const email = token.slice(4);
    return {
      uid: process.env.DEV_ADMIN_UID || `dev-admin-${email.replace(/[^a-z0-9]/gi, "")}`,
      email,
      email_verified: true,
      role: "admin",
      authProvider: "legacy-dev",
    };
  }
  if (!admin.isReady?.()) return null;
  const decoded = await admin.auth().verifyIdToken(token);
  const superAdminUid = process.env.SUPER_ADMIN_UID || process.env.VITE_SUPER_ADMIN_UID || "";
  if (!decoded.email_verified && decoded.uid !== superAdminUid && decoded.authProvider !== "local") {
    const error = new Error("Email is not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    throw error;
  }
  return { ...decoded, uid: decoded.uid, authProvider: decoded.authProvider || "firebase" };
}

async function requireAuth(req, res, next) {
  try {
    req.user = await authenticate(req, res);
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    return next();
  } catch (error) {
    if (error.code === "AUTH_NOT_CONFIGURED") {
      return res.status(503).json({ error: "Authentication service is not configured" });
    }
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

async function optionalAuth(req, _res, next) {
  try { req.user = await authenticate(req, _res); } catch { req.user = null; }
  next();
}

module.exports = { requireAuth, optionalAuth, authenticate };
