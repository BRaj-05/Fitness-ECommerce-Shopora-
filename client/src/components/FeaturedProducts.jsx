import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import ProductVisual from "./ProductVisual";
import { fmt } from "../utils/formatters";
import { API_URL } from "../config/app";

export default function FeaturedProducts() {
  const navigate = useNavigate();

  const [products, setProducts] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let active = true;

    fetch(
      `${API_URL}/api/products?all=true`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Unable to load featured products",
          );
        }

        return response.json();
      })
      .then((data) => {
        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : data?.data || [];

        const featured = [...list]
          .sort(
            (a, b) =>
              Number(b.rating || 0) -
              Number(a.rating || 0),
          )
          .slice(0, 6);

        setProducts(featured);
      })
      .catch((error) => {
        console.error(
          "Featured products:",
          error,
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="border-b border-[var(--lux-line)] bg-[var(--lux-bg)] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="lux-eyebrow">
              Store preview
            </p>

            <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight">
              Featured products
            </h2>

            <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
              A quick preview. The complete catalog lives in Shop.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/shop")
            }
            className="w-fit rounded-xl bg-[var(--lux-ink)] px-5 py-2.5 text-xs font-bold text-[var(--lux-bg)] transition hover:opacity-85"
          >
            View all products →
          </button>
        </div>

        {loading ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-3xl border border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <button
                type="button"
                key={product.productId}
                onClick={() =>
                  navigate(
                    `/product/${product.productId}`,
                  )
                }
                className="lux-product-card group flex text-left"
              >
                <div className="h-36 w-36 shrink-0 overflow-hidden bg-[var(--lux-soft)]">
                  <ProductVisual
                    product={product}
                    className="transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">
                    {product.type ||
                      product.category}
                  </p>

                  <h3 className="mt-1 line-clamp-2 font-heading text-base font-extrabold">
                    {product.name}
                  </h3>

                  <p className="mt-3 font-heading text-lg font-extrabold">
                    {fmt(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
