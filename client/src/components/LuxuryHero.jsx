import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import ProductVisual from "./ProductVisual";
import { API_URL } from "../config/app";
import { fmt } from "../utils/formatters";

const SLIDE_TYPES = [
  {
    type: "Protein Powder",
    kicker: "PERFORMANCE NUTRITION",
    title: "Fuel the next rep.",
    copy: "Protein essentials with live Shopora inventory and a checkout flow built for speed.",
    accent: "#FF5C35",
  },
  {
    type: "Jump Rope",
    kicker: "CONDITIONING",
    title: "Move with intent.",
    copy: "Compact cardio equipment for fast sessions, warm-ups and endurance work.",
    accent: "#7B72FF",
  },
  {
    type: "Resistance Bands",
    kicker: "TRAIN ANYWHERE",
    title: "Strength, without limits.",
    copy: "Portable resistance for activation, strength and mobility — at home or on the move.",
    accent: "#12BFA3",
  },
];

export default function LuxuryHero() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch(`${API_URL}/api/products?all=true`)
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((payload) => {
        if (!alive) return;
        setProducts(Array.isArray(payload) ? payload : payload?.data || []);
      })
      .catch(() => {
        if (alive) setProducts([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  const slides = useMemo(
    () =>
      SLIDE_TYPES.map((slide) => {
        const candidates = products.filter((product) => product.type === slide.type);
        const product =
          candidates.find(
            (entry) =>
              entry.stock === null ||
              Number(entry.stock || 0) - Number(entry.reserved || 0) > 0,
          ) ||
          candidates[0] ||
          null;

        return { ...slide, product };
      }),
    [products],
  );

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % slides.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[active];
  const product = slide.product;

  return (
    <section
      className="lux-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="lux-hero-aura" style={{ "--hero-accent": slide.accent }} />

      <div className="lux-hero-grid">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: slide.accent }} />
            <span className="lux-eyebrow text-white/55">{slide.kicker}</span>
          </div>

          <h1 className="lux-display mt-5 max-w-[760px] text-white">{slide.title}</h1>

          <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">
            {slide.copy}
          </p>

          {product && (
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Featured</p>
                <p className="mt-1 max-w-sm text-sm font-bold text-white">{product.name}</p>
              </div>
              <p className="font-heading text-3xl font-extrabold text-white">{fmt(product.price)}</p>
            </div>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                product ? navigate(`/product/${product.productId}`) : navigate("/shop")
              }
              className="lux-primary-light"
            >
              View feature
            </button>

            <button type="button" onClick={() => navigate("/shop")} className="lux-secondary-dark">
              Shop collection
            </button>
          </div>

          <div className="mt-12 flex items-center gap-4">
            {slides.map((item, index) => (
              <button
                type="button"
                key={item.type}
                onClick={() => setActive(index)}
                aria-label={`Show ${item.type} promotion`}
                className="group flex items-center gap-2"
              >
                <span
                  className={`block h-[2px] transition-all duration-300 ${
                    active === index
                      ? "w-10 bg-white"
                      : "w-5 bg-white/25 group-hover:bg-white/50"
                  }`}
                />
                <span className="text-[9px] font-bold tracking-[0.14em] text-white/35">
                  0{index + 1}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="lux-hero-product-shell">
            <div className="lux-hero-product-frame">
              {product ? (
                <ProductVisual product={product} className="transition duration-700 hover:scale-[1.025]" />
              ) : (
                <div className="h-full w-full bg-[#ECE8DF]" />
              )}
            </div>

            <div className="lux-floating-tag lux-floating-tag-top">SHOPORA / 2026</div>
            <div className="lux-floating-tag lux-floating-tag-bottom">REAL-TIME STOCK</div>
          </div>
        </div>
      </div>

      <div className="lux-hero-bottom">
        <span>Secure Razorpay checkout</span>
        <span>Firebase authentication</span>
        <span>MongoDB inventory</span>
        <span>Server-verified payments</span>
      </div>
    </section>
  );
}
