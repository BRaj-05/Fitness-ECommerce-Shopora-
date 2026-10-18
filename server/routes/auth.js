const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const AuthUser = require("../models/AuthUser");
const UserProfile = require("../models/UserProfile");
const RefreshSession = require("../models/RefreshSession");
const { requireAuth } = require("../middleware/requireAuth");
const {
  REFRESH_COOKIE,
  clearAuthCookies,
  hashToken,
  issueSession,
  readCookies,
  safeUser,
  verifyRefresh,
} = require("../lib/authTokens");

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const OAUTH_COOKIE_MS = 10 * 60 * 1000;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();
const base64url = (buffer) => Buffer.from(buffer).toString("base64url");
const clientUrl = () => String(process.env.CLIENT_URL || process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const secureCookie = () => ({ httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: OAUTH_COOKIE_MS });

function validateUsername(username) {
  return /^[a-z0-9._-]{3,30}$/.test(username)
    ? ""
    : "Username must be 3-30 characters using letters, numbers, dot, underscore or hyphen";
}

function validatePassword(password) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  return "";
}

async function syncProfile(account) {
  await UserProfile.findOneAndUpdate(
    { userId: account.uid },
    {
      $set: {
        email: account.email,
        ...(account.name ? { name: account.name } : {}),
        ...(account.avatarUrl ? { photoURL: account.avatarUrl } : {}),
      },
      $setOnInsert: { userId: account.uid },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

async function findOrCreateOAuthUser(provider, identity) {
  const providerMatch = {
    providers: { $elemMatch: { provider, providerAccountId: String(identity.id) } },
  };
  let account = await AuthUser.findOne(providerMatch);
  if (account) {
    account.lastLoginAt = new Date();
    if (identity.avatarUrl) account.avatarUrl = identity.avatarUrl;
    if (!account.name && identity.name) account.name = identity.name;
    await account.save();
    await syncProfile(account);
    return account;
  }

  const email = normalizeEmail(identity.email);
  if (!identity.emailVerified || !email) {
    const error = new Error("A verified email is required to sign in");
    error.code = "UNVERIFIED_EMAIL";
    throw error;
  }

  account = await AuthUser.findOne({ email });
  const providerRecord = {
    provider,
    providerAccountId: String(identity.id),
    email,
    linkedAt: new Date(),
  };
  if (account) {
    account.providers = account.providers || [];
    if (!account.providers.some((item) => item.provider === provider && item.providerAccountId === String(identity.id))) {
      account.providers.push(providerRecord);
    }
    if (identity.avatarUrl && !account.avatarUrl) account.avatarUrl = identity.avatarUrl;
    account.lastLoginAt = new Date();
    await account.save();
  } else {
    const existingProfile = await UserProfile.findOne({ email }).lean();
    account = await AuthUser.create({
      uid: existingProfile?.userId || `usr_${crypto.randomUUID()}`,
      name: String(identity.name || email.split("@")[0]).trim().slice(0, 80),
      email,
      provider,
      providers: [providerRecord],
      avatarUrl: identity.avatarUrl || "",
      lastLoginAt: new Date(),
    });
  }
  await syncProfile(account);
  return account;
}

function oauthStart(res, provider) {
  const state = base64url(crypto.randomBytes(32));
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  res.cookie(`shopora_${provider}_state`, state, secureCookie());
  res.cookie(`shopora_${provider}_verifier`, verifier, secureCookie());
  return { state, challenge };
}

function consumeOAuth(req, res, provider) {
  const cookies = readCookies(req);
  const state = cookies[`shopora_${provider}_state`];
  const verifier = cookies[`shopora_${provider}_verifier`];
  const clear = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };
  res.clearCookie(`shopora_${provider}_state`, clear);
  res.clearCookie(`shopora_${provider}_verifier`, clear);
  const returnedState = String(req.query.state || "");
  if (!state || !verifier || state.length !== returnedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(returnedState))) {
    const error = new Error("OAuth state validation failed");
    error.code = "OAUTH_STATE";
    throw error;
  }
  return verifier;
}

function oauthFailure(res, message) {
  const target = new URL("/auth", clientUrl());
  target.searchParams.set("error", message);
  return res.redirect(target.toString());
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim().slice(0, 80);
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const usernameError = validateUsername(username);
    if (usernameError) return res.status(400).json({ error: usernameError });
    if (!email || !email.includes("@")) return res.status(400).json({ error: "Enter a valid email address" });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    const existing = await AuthUser.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      return res.status(409).json({ error: existing.email === email ? "An account with this email already exists" : "This username is already taken" });
    }
    const uid = `usr_${crypto.randomUUID()}`;
    const account = await AuthUser.create({
      uid,
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      provider: "local",
      providers: [{ provider: "local", providerAccountId: uid, email }],
      lastLoginAt: new Date(),
    });
    await syncProfile(account);
    const session = await issueSession(res, account, req);
    return res.status(201).json({ authenticated: true, user: session.user });
  } catch (error) {
    if (error.code === "AUTH_NOT_CONFIGURED") return res.status(503).json({ error: "Authentication service is not configured" });
    if (error.code === 11000) return res.status(409).json({ error: "Email or username already exists" });
    console.error("Shopora registration failed:", error.message);
    return res.status(500).json({ error: "Unable to create account right now" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const identifier = String(req.body.identifier || "").trim().toLowerCase();
    const password = req.body.password;
    if (!identifier || !password) return res.status(400).json({ error: "Email/username and password are required" });
    const query = identifier.includes("@") ? { email: normalizeEmail(identifier) } : { username: normalizeUsername(identifier) };
    const account = await AuthUser.findOne(query).select("+passwordHash");
    const valid = Boolean(account?.passwordHash) && await bcrypt.compare(password, account.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email/username or password" });
    if (!(account.providers || []).some((item) => item.provider === "local")) {
      account.providers.push({ provider: "local", providerAccountId: account.uid, email: account.email });
    }
    account.lastLoginAt = new Date();
    await account.save();
    await syncProfile(account);
    const session = await issueSession(res, account, req);
    return res.json({ authenticated: true, user: session.user });
  } catch (error) {
    if (error.code === "AUTH_NOT_CONFIGURED") return res.status(503).json({ error: "Authentication service is not configured" });
    console.error("Shopora login failed:", error.message);
    return res.status(500).json({ error: "Unable to complete sign in right now" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const account = await AuthUser.findOne({ uid: req.user.uid });
  if (!account) return res.status(404).json({ error: "Account not found" });
  return res.json({ authenticated: true, user: safeUser(account) });
});

router.post("/refresh", async (req, res) => {
  try {
    const token = readCookies(req)[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: "Refresh session required" });
    const decoded = verifyRefresh(token);
    if (decoded.type !== "refresh" || !decoded.sessionId) throw new Error("Invalid refresh token");
    const session = await RefreshSession.findOne({ sessionId: decoded.sessionId }).select("+refreshTokenHash");
    const supplied = Buffer.from(hashToken(token), "hex");
    const stored = Buffer.from(session?.refreshTokenHash || "", "hex");
    const valid = session && !session.revokedAt && session.expiresAt > new Date() && supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
    if (!valid) {
      if (session && !session.revokedAt) await RefreshSession.updateOne({ _id: session._id }, { revokedAt: new Date() });
      clearAuthCookies(res);
      return res.status(401).json({ error: "Refresh session is invalid or expired" });
    }
    const account = await AuthUser.findOne({ uid: decoded.sub });
    if (!account) return res.status(401).json({ error: "Account not found" });
    const rotated = await issueSession(res, account, req, session);
    return res.json({ authenticated: true, user: rotated.user });
  } catch (error) {
    clearAuthCookies(res);
    if (error.code === "AUTH_NOT_CONFIGURED") return res.status(503).json({ error: "Authentication service is not configured" });
    return res.status(401).json({ error: "Refresh session is invalid or expired" });
  }
});

router.post("/logout", async (req, res) => {
  const token = readCookies(req)[REFRESH_COOKIE];
  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await RefreshSession.updateOne({ sessionId: decoded.sessionId }, { revokedAt: new Date() });
    } catch {}
  }
  clearAuthCookies(res);
  return res.json({ success: true });
});

router.post("/logout-all", requireAuth, async (req, res) => {
  await RefreshSession.updateMany({ userId: req.user.uid, revokedAt: null }, { revokedAt: new Date() });
  clearAuthCookies(res);
  return res.json({ success: true });
});

router.get("/google", (_req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) return oauthFailure(res, "Google sign-in is not configured");
  const { state, challenge } = oauthStart(res, "google");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return res.redirect(url.toString());
});

router.get("/google/callback", async (req, res) => {
  try {
    const verifier = consumeOAuth(req, res, "google");
    if (!req.query.code) throw new Error("Google authorization was cancelled");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error("Google token exchange failed");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) throw new Error("Google identity lookup failed");
    const account = await findOrCreateOAuthUser("google", {
      id: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified === true,
      name: profile.name,
      avatarUrl: profile.picture,
    });
    await issueSession(res, account, req);
    return res.redirect(`${clientUrl()}/home`);
  } catch (error) {
    console.error("Google OAuth failed:", error.message);
    return oauthFailure(res, "Google sign-in could not be completed");
  }
});

router.get("/github", (_req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CALLBACK_URL) return oauthFailure(res, "GitHub sign-in is not configured");
  const { state, challenge } = oauthStart(res, "github");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  return res.redirect(url.toString());
});

router.get("/github/callback", async (req, res) => {
  try {
    const verifier = consumeOAuth(req, res, "github");
    if (!req.query.code) throw new Error("GitHub authorization was cancelled");
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: String(req.query.code),
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        code_verifier: verifier,
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error("GitHub token exchange failed");
    const headers = { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "Shopora" };
    const [profileResponse, emailsResponse] = await Promise.all([
      fetch("https://api.github.com/user", { headers }),
      fetch("https://api.github.com/user/emails", { headers }),
    ]);
    const profile = await profileResponse.json();
    const emails = emailsResponse.ok ? await emailsResponse.json() : [];
    const verified = Array.isArray(emails) ? emails.find((item) => item.verified && item.primary) || emails.find((item) => item.verified) : null;
    const email = verified?.email || (profile.email && emails.some((item) => item.email === profile.email && item.verified) ? profile.email : "");
    if (!profileResponse.ok || !profile.id || !email) throw new Error("GitHub did not provide a verified email");
    const account = await findOrCreateOAuthUser("github", {
      id: profile.id,
      email,
      emailVerified: true,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
    });
    await issueSession(res, account, req);
    return res.redirect(`${clientUrl()}/home`);
  } catch (error) {
    console.error("GitHub OAuth failed:", error.message);
    return oauthFailure(res, "GitHub sign-in could not be completed");
  }
});

module.exports = router;
