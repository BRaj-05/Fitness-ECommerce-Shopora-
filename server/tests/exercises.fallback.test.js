const express = require("express");
const request = require("supertest");

const originalApiKey = process.env.RAPIDAPI_KEY;
delete process.env.RAPIDAPI_KEY;

const exercisesRouter = require("../routes/exercises");
const app = express();
app.use("/api/exercises", exercisesRouter);

afterAll(() => {
  if (originalApiKey === undefined) delete process.env.RAPIDAPI_KEY;
  else process.env.RAPIDAPI_KEY = originalApiKey;
});

test.each(["chest", "back", "arms", "legs", "shoulders", "abs", "cardio"])(
  "serves a usable %s exercise catalog without an external API key",
  async (category) => {
    const response = await request(app).get(`/api/exercises/${category}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        bodyPart: expect.any(String),
      }),
    );
  },
);

test("rejects unsupported exercise categories", async () => {
  const response = await request(app).get("/api/exercises/unknown");
  expect(response.status).toBe(400);
});
