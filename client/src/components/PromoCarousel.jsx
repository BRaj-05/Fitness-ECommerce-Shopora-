import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import ProductVisual from "./ProductVisual";
import { API_URL } from "../config/app";
import { fmt } from "../utils/formatters";

const FALLBACK_SLIDES = [
  {
    id: "protein",
    type: "Protein Powder",
    eyebrow: "TRAINING NUTRITION",
    title: "Fuel the work.",
    copy:
      "Explore protein powders built into the Shopora catalog with real stock tracking.",
  },
  {
    id: "rope",
    type: "Jump Rope",
    eyebrow: "CARDIO ESSENTIALS",
    title: "Move faster.",
    copy:
      "Speed, endurance and beginner jump ropes for compact training sessions.",
  },
  {
    id: "bands",
    type: "Resistance Bands",
    eyebrow: "HOME TRAINING",
    title: "Train anywhere.",
    copy:
      "Portable resistance options for strength, warm-ups and mobility work.",
  },
];

export default function PromoCarousel() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch(`${API_URL}/api/products?all=true`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Catalog unavailable");
        }

        return response.json();
      })
      .then((payload) => {
        if (!alive) return;

        const list = Array.isArray(payload)
          ? payload
          : payload?.data || [];

        setProducts(list);
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
      FALLBACK_SLIDES.map((slide) => {
        const product =
          products.find(
            (entry) =>
              entry.type === slide.type &&
              Number(entry.stock || 0) -
                Number(entry.reserved || 0) >
                0,
          ) ||
          products.find(
            (entry) =>
              entry.type === slide.type,
          ) ||
          null;

        return {
          ...slide,
          product,
        };
      }),
    [products],
  );

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(() => {
      setActive(
        (current) =>
          (current + 1) % slides.length,
      );
    }, 5000);

    return () =>
      window.clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[active];
  const product = slide.product;

  const previous = () => {
    setActive(
      (current) =>
        (current - 1 + slides.length) %
        slides.length,
    );
  };

  const next = () => {
    setActive(
      (current) =>
        (current + 1) % slides.length,
    );
  };

  return (
    <section
      className="relative overflow-hidden border-b border-stone-200 bg-stone-950 text-white dark:border-slate-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-10">
        <div className="shopora-product-hero-enter">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              {slide.eyebrow}
            </p>
          </div>

          <h1 className="font-heading mt-5 max-w-2xl text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            {slide.title}
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-stone-400 sm:text-base">
            {slide.copy}
          </p>

          {product && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-stone-400">
                  Featured
                </p>
                <p className="mt-1 font-bold">
                  {product.name}
                </p>
              </div>

              <p className="font-heading text-2xl font-extrabold">
                {fmt(product.price)}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                product
                  ? navigate(
                      `/product/${product.productId}`,
                    )
                  : navigate("/shop")
              }
              className="shopora-button-press rounded-full bg-white px-6 py-3 text-sm font-bold text-stone-950 hover:bg-stone-100"
            >
              {product
                ? "View featured product"
                : "Explore products"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/shop")}
              className="shopora-button-press rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              Shop all
            </button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/30">
            {product ? (
              <ProductVisual product={product} />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-br from-stone-100 to-stone-200 text-7xl text-stone-950">
                S
              </div>
            )}
          </div>

          <div className="absolute -bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous promotion"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-sm hover:bg-white/10"
            >
              {"<"}
            </button>

            <div className="flex gap-2">
              {slides.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`Promotion ${index + 1}`}
                  onClick={() => setActive(index)}
                  className={`h-2 rounded-full transition-all ${
                    active === index
                      ? "w-7 bg-white"
                      : "w-2 bg-white/35"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next promotion"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-sm hover:bg-white/10"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
