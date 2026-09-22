const express = require("express");
const request = require("supertest");

const OLD_ENV = { ...process.env };

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use("/api/admin", require("../routes/adminSession"));
  instance.get("/api/admin/protected-test", require("../middleware/adminSession").requireAdminSession, (_req, res) => res.json({ ok: true }));
  return instance;
}

beforeEach(() => {
  process.env.ADMIN_LOGIN_EMAIL = "admin@example.com";
  process.env.ADMIN_LOGIN_PASSWORD = "correct-password";
  process.env.ADMIN_SESSION_SECRET = "test-secret-that-is-long-enough";
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  process.env = OLD_ENV;
});

test("rejects wrong email and password with a generic response", async () => {
  for (const credentials of [
    { email: "wrong@example.com", password: "correct-password" },
    { email: "admin@example.com", password: "wrong-password" },
  ]) {
    const response = await request(app()).post("/api/admin/login").send(credentials);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid admin credentials");
  }
});

test("creates, validates, and clears an HttpOnly admin session", async () => {
  const agent = request.agent(app());
  const login = await agent.post("/api/admin/login").send({ email: "admin@example.com", password: "correct-password" });
  expect(login.status).toBe(200);
  expect(login.headers["set-cookie"][0]).toContain("HttpOnly");
  expect(login.headers["set-cookie"][0]).toContain("SameSite=Lax");

  const session = await agent.get("/api/admin/session");
  expect(session.body).toEqual({ authenticated: true, email: "admin@example.com" });

  await agent.post("/api/admin/logout").expect(200);
  expect((await agent.get("/api/admin/session")).body.authenticated).toBe(false);
});

test("rejects a protected admin endpoint without a session", async () => {
  await request(app()).get("/api/admin/protected-test").expect(401);
});
