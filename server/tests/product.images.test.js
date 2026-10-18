const express = require("express");
const request = require("supertest");

process.env.PEXELS_API_KEY = "test-pexels-key";
delete process.env.CLOUDINARY_CLOUD_NAME;
delete process.env.CLOUDINARY_API_KEY;
delete process.env.CLOUDINARY_API_SECRET;

jest.mock("../lib/cache", () => ({ get: jest.fn(), set: jest.fn(), delPattern: jest.fn() }));
jest.mock("../middleware/verifyAdminRequest", () => (req, res, next) => req.headers["x-test-admin"] === "yes" ? next() : res.status(403).json({ error: "Admin required" }));
jest.mock("../middleware/validateRequest", () => () => (req, _res, next) => next());

const savedProducts = [];
jest.mock("../models/Product", () => {
  const Product = jest.fn().mockImplementation((body) => ({
    ...body,
    save: jest.fn(async function save() { savedProducts.push({ ...body }); }),
  }));
  Product.findOne = jest.fn(async () => null);
  Product.find = jest.fn();
  return Product;
});

const productsRouter = require("../routes/products");

describe("admin product image automation", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/products", productsRouter);
  });

  afterEach(() => {
    savedProducts.length = 0;
    jest.restoreAllMocks();
  });

  test("Pexels search is admin-only and returns normalized candidates", async () => {
    await request(app).get("/api/products/image-search?q=yoga+mat").expect(403);
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      photos: [{ id: 7, src: { medium: "https://images.example/preview.jpg", large: "https://images.example/full.jpg" }, photographer: "Photo Maker", photographer_url: "https://pexels.com/@maker", url: "https://pexels.com/photo/7", alt: "Yoga mat" }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const response = await request(app).get("/api/products/image-search?q=yoga+mat").set("x-test-admin", "yes");
    expect(response.status).toBe(200);
    expect(response.body.results[0]).toMatchObject({ pexelsId: "7", photographer: "Photo Maker" });
    expect(fetchSpy.mock.calls[0][1].headers.Authorization).toBe("test-pexels-key");
    expect(JSON.stringify(response.body)).not.toContain("test-pexels-key");
  });

  test("Pexels failure is non-secret and explicit", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("unavailable", { status: 503 }));
    const response = await request(app).get("/api/products/image-search?q=foam+roller").set("x-test-admin", "yes");
    expect(response.status).toBe(502);
    expect(response.body.error).toMatch(/temporarily unavailable/i);
  });

  test("selected Pexels metadata persists and URL remains fallback without Cloudinary", async () => {
    const payload = {
      productId: 2001,
      name: "Test Yoga Mat",
      price: 999,
      image: "https://images.example/full.jpg",
      imageSource: "pexels",
      imageCredit: { provider: "Pexels", photographer: "Photo Maker", sourceUrl: "https://pexels.com/photo/7", sourceId: "7" },
    };
    const response = await request(app).post("/api/products").set("x-test-admin", "yes").send(payload);
    expect(response.status).toBe(201);
    expect(savedProducts[0]).toMatchObject({ image: payload.image, imageSource: "pexels", imageCredit: payload.imageCredit });
  });
});
