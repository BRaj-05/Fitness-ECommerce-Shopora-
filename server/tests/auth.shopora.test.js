const fs = require("fs");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_ACCESS_SECRET = "test-access-secret-with-sufficient-length";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-sufficient-length";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "7d";
process.env.ENABLE_LEGACY_FIREBASE_AUTH = "false";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.GOOGLE_CLIENT_ID = "google-client";
process.env.GOOGLE_CLIENT_SECRET = "google-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost/api/auth/google/callback";
process.env.GITHUB_CLIENT_ID = "github-client";
process.env.GITHUB_CLIENT_SECRET = "github-secret";
process.env.GITHUB_CALLBACK_URL = "http://localhost/api/auth/github/callback";

const AuthUser = require("../models/AuthUser");
const RefreshSession = require("../models/RefreshSession");
const authRouter = require("../routes/auth");
const { requireAuth } = require("../middleware/requireAuth");

let mongo;
let app;

beforeAll(async () => {
  const binary = "C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe";
  if (process.platform === "win32" && fs.existsSync(binary)) process.env.MONGOMS_SYSTEM_BINARY = binary;
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.get("/protected", requireAuth, (req, res) => res.json({ uid: req.user.uid }));
});

afterEach(async () => {
  await Promise.all([AuthUser.deleteMany({}), RefreshSession.deleteMany({})]);
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const registration = { name: "Shopora User", username: "shopora.user", email: "user@example.com", password: "correct-horse-123" };

describe("Shopora local JWT sessions", () => {
  test("registers, prevents duplicates, and supports email/username login", async () => {
    const register = await request(app).post("/api/auth/register").send(registration);
    expect(register.status).toBe(201);
    expect(register.headers["set-cookie"].join(";")).toContain("shopora_access=");
    expect(register.headers["set-cookie"].join(";")).toContain("HttpOnly");

    expect((await request(app).post("/api/auth/register").send(registration)).status).toBe(409);
    expect((await request(app).post("/api/auth/register").send({ ...registration, email: "other@example.com" })).status).toBe(409);
    expect((await request(app).post("/api/auth/login").send({ identifier: registration.email, password: registration.password })).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ identifier: registration.username, password: registration.password })).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ identifier: registration.email, password: "wrong-password" })).status).toBe(401);
  });

  test("supports me, refresh rotation, replay rejection, and logout", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(registration).expect(201);
    await agent.get("/api/auth/me").expect(200);

    const login = await request(app).post("/api/auth/login").send({ identifier: registration.email, password: registration.password });
    const oldRefresh = login.headers["set-cookie"].find((cookie) => cookie.startsWith("shopora_refresh=")).split(";")[0];
    const refresh = await request(app).post("/api/auth/refresh").set("Cookie", oldRefresh);
    expect(refresh.status).toBe(200);
    const newRefresh = refresh.headers["set-cookie"].find((cookie) => cookie.startsWith("shopora_refresh=")).split(";")[0];
    expect(newRefresh).not.toBe(oldRefresh);
    expect((await request(app).post("/api/auth/refresh").set("Cookie", oldRefresh)).status).toBe(401);

    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/auth/me").expect(401);
  });

  test("rejects missing, invalid-signature, and expired access tokens", async () => {
    await request(app).get("/protected").expect(401);
    const wrong = jwt.sign({ sessionId: "x" }, "wrong-secret", { subject: "usr_x", expiresIn: "1h", issuer: "shopora", audience: "shopora-web" });
    await request(app).get("/protected").set("Cookie", `shopora_access=${wrong}`).expect(401);
    const expired = jwt.sign({ sessionId: "x" }, process.env.JWT_ACCESS_SECRET, { subject: "usr_x", expiresIn: -1, issuer: "shopora", audience: "shopora-web" });
    await request(app).get("/protected").set("Cookie", `shopora_access=${expired}`).expect(401);
  });
});

describe("OAuth safety", () => {
  test("Google and GitHub starts use state, PKCE, and minimum scopes", async () => {
    const google = await request(app).get("/api/auth/google");
    expect(google.status).toBe(302);
    expect(google.headers.location).toContain("code_challenge_method=S256");
    expect(google.headers.location).toContain("scope=openid+email+profile");

    const github = await request(app).get("/api/auth/github");
    expect(github.status).toBe(302);
    expect(github.headers.location).toContain("code_challenge_method=S256");
    expect(github.headers.location).toContain("scope=read%3Auser+user%3Aemail");
    expect(github.headers.location).not.toContain("repo");
  });

  test("callbacks reject invalid state without provider network calls", async () => {
    const fetchSpy = jest.spyOn(global, "fetch");
    const google = await request(app).get("/api/auth/google/callback?code=x&state=bad");
    const github = await request(app).get("/api/auth/github/callback?code=x&state=bad");
    expect(google.status).toBe(302);
    expect(github.status).toBe(302);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("Google callback links only a verified matching email", async () => {
    await request(app).post("/api/auth/register").send(registration).expect(201);
    const agent = request.agent(app);
    const start = await agent.get("/api/auth/google");
    const state = new URL(start.headers.location).searchParams.get("state");
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "google-token" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sub: "google-123", email: registration.email, email_verified: true, name: "Google User", picture: "https://example.com/avatar.jpg" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const callback = await agent.get(`/api/auth/google/callback?code=valid&state=${encodeURIComponent(state)}`);
    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173/home");
    expect(await AuthUser.countDocuments({ email: registration.email })).toBe(1);
    const account = await AuthUser.findOne({ email: registration.email });
    expect(account.providers.some((item) => item.provider === "google" && item.providerAccountId === "google-123")).toBe(true);
  });

  test("GitHub callback uses a verified email and stores no provider token", async () => {
    const agent = request.agent(app);
    const start = await agent.get("/api/auth/github");
    const state = new URL(start.headers.location).searchParams.get("state");
    jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "github-token" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 44, login: "octoshopora", name: "GitHub User", avatar_url: "https://example.com/github.jpg", email: null }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ email: "github@example.com", verified: true, primary: true }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const callback = await agent.get(`/api/auth/github/callback?code=valid&state=${encodeURIComponent(state)}`);
    expect(callback.status).toBe(302);
    const account = await AuthUser.findOne({ email: "github@example.com" }).lean();
    expect(account.providers[0]).toMatchObject({ provider: "github", providerAccountId: "44" });
    expect(JSON.stringify(account)).not.toContain("github-token");
  });
});
