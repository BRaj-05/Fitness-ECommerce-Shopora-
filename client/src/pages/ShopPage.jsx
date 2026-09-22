import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import ProductVisual from "../components/ProductVisual";

import { useAuth } from "../auth/useAuth";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { fmt } from "../utils/formatters";
import { API_URL } from "../config/app";

const PRODUCT_TYPES = [
  "All",
  "Protein Powder",
  "Protein Bar",
  "Shaker Bottle",
  "Jump Rope",
  "Resistance Bands",
  "Yoga Mat",
  "Foam Roller",
  "Fitness Tracker",
];

const CATEGORIES = [
  "All",
  "Nutrition",
  "Training Gear",
  "Recovery",
  "Wearables",
];

function availableStock(product) {
  if (product.stock === null) return null;

  return Math.max(
    0,
    Number(product.stock || 0) -
      Number(product.reserved || 0),
  );
}

function enrichCart(cartDoc, products) {
  return (cartDoc?.items || [])
    .map((item) => {
      const product = products.find(
        (entry) =>
          Number(entry.productId) ===
          Number(item.productId),
      );

      if (!product) return null;

      return {
        ...product,
        id: product.productId,
        qty: item.quantity,
      };
    })
    .filter(Boolean);
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] =
    useState("featured");

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (requestedType && PRODUCT_TYPES.includes(requestedType)) setType(requestedType);
  }, [searchParams]);

  const [cartOpen, setCartOpen] =
    useState(false);
  const [addingId, setAddingId] =
    useState(null);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + item.price * item.qty,
    0,
  );

  const loadCart = useCallback(async (
    productsList,
    currentUser = user,
  ) => {
    if (!currentUser) {
      setCart([]);
      return;
    }

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/cart/${currentUser.uid}`,
        {
          headers,
          credentials: "include",
        },
      );

      if (!response.ok) return;

      const cartDoc =
        await response.json();

      setCart(
        enrichCart(
          cartDoc,
          productsList,
        ),
      );
    } catch (loadError) {
      console.error(
        "Shop cart load failed:",
        loadError,
      );
    }
  }, [user]);

  useEffect(() => {
    document.title = "Shop | Shopora";
    window.scrollTo(0, 0);

    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/products?all=true`,
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load products",
          );
        }

        const data = await response.json();

        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : data?.data || [];

        setProducts(list);

        await loadCart(
          list,
          user,
        );
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message ||
              "Unable to load Shopora",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [loadCart, user]);

  const filteredProducts = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    let next = products.filter(
      (product) => {
        const categoryMatch =
          category === "All" ||
          product.category === category;

        const typeMatch =
          type === "All" ||
          product.type === type;

        const searchMatch =
          !normalized ||
          [
            product.name,
            product.brand,
            product.type,
            product.category,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalized);

        return (
          categoryMatch &&
          typeMatch &&
          searchMatch
        );
      },
    );

    next = [...next];

    if (sort === "price-low") {
      next.sort(
        (a, b) => a.price - b.price,
      );
    } else if (
      sort === "price-high"
    ) {
      next.sort(
        (a, b) => b.price - a.price,
      );
    } else if (sort === "rating") {
      next.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0),
      );
    } else {
      next.sort(
        (a, b) =>
          Number(a.productId) -
          Number(b.productId),
      );
    }

    return next;
  }, [
    products,
    query,
    category,
    type,
    sort,
  ]);

  const addToCart = async (
    product,
  ) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const available =
      availableStock(product);

    if (available !== null && available <= 0) {
      return;
    }

    setAddingId(product.productId);

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/cart/${user.uid}/add`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            productId:
              product.productId,
            quantity: 1,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to add product",
        );
      }

      setCart(
        enrichCart(
          data,
          products,
        ),
      );

      setCartOpen(true);
    } catch (addError) {
      window.alert(
        addError.message ||
          "Unable to add product",
      );
    } finally {
      setAddingId(null);
    }
  };

  const updateQty = async (
    productId,
    delta,
  ) => {
    if (!user) return;

    const headers =
      await getAuthHeaders();

    const endpoint =
      delta > 0 ? "add" : "remove";

    const response = await fetch(
      `${API_URL}/api/cart/${user.uid}/${endpoint}`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          productId,
          quantity: Math.abs(delta),
        }),
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      window.alert(
        data.error ||
          "Unable to update cart",
      );
      return;
    }

    setCart(
      enrichCart(data, products),
    );
  };

  const removeFromCart = async (
    productId,
  ) => {
    if (!user) return;

    const existing = cart.find(
      (item) => item.id === productId,
    );

    if (!existing) return;

    const headers =
      await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/api/cart/${user.uid}/remove`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          productId,
          quantity: existing.qty,
        }),
      },
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      window.alert(
        data.error ||
          "Unable to remove product",
      );
      return;
    }

    setCart(
      enrichCart(data, products),
    );
  };

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <Navbar
        variant="home"
        cartCount={cartCount}
        onCartOpen={() =>
          setCartOpen(true)
        }
      />

      <main>
        <section className="border-b border-[var(--lux-line)] bg-[var(--lux-surface)]">
          <div className="lux-shop-intro">
            <p className="lux-eyebrow">
              Shopora store
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                  Shop training essentials.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500 dark:text-slate-400">
                  Browse nutrition, training equipment and wearables. Search by product name, brand or type.
                </p>
              </div>

              <p className="text-sm font-semibold text-stone-500 dark:text-slate-400">
                {filteredProducts.length} of{" "}
                {products.length} products
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <div className="lux-filter-rail">
            <div className="shopora-quick-types mb-4">
              {PRODUCT_TYPES.map((value) => (
                <button key={value} type="button" onClick={() => setType(value)} className={`shopora-quick-type ${type === value ? "shopora-quick-type-active" : ""}`}>
                  {({ "Shaker Bottle": "Shakers", "Jump Rope": "Jump Ropes", "Resistance Bands": "Bands", "Yoga Mat": "Yoga", "Foam Roller": "Recovery", "Fitness Tracker": "Trackers" })[value] || value}
                </button>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px_180px]">
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search protein powder, jump rope, brand…"
                className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 text-sm outline-none transition focus:border-[var(--lux-muted)]"
              />

              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-sm"
              >
                {PRODUCT_TYPES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value === "All"
                        ? "All product types"
                        : value}
                    </option>
                  ),
                )}
              </select>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-sm"
              >
                {CATEGORIES.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value === "All"
                        ? "All categories"
                        : value}
                    </option>
                  ),
                )}
              </select>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value)
                }
                className="h-11 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-sm"
              >
                <option value="featured">
                  Featured
                </option>
                <option value="price-low">
                  Price: low to high
                </option>
                <option value="price-high">
                  Price: high to low
                </option>
                <option value="rating">
                  Highest rated
                </option>
              </select>
            </div>

            {(query ||
              category !== "All" ||
              type !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setType("All");
                }}
                className="mt-3 text-xs font-semibold text-stone-500 underline underline-offset-4 hover:text-stone-950 dark:hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-[410px] animate-pulse rounded-3xl border border-stone-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
              <p className="font-bold">Unable to load products</p>
              <p className="mt-1 text-xs opacity-80">
                {error}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            products.length === 0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                <h2 className="font-heading text-2xl font-extrabold">
                  Catalog is empty
                </h2>

                <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                  Run the non-destructive Shopora catalog seed from the server.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            products.length > 0 &&
            filteredProducts.length ===
              0 && (
              <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                <h2 className="font-heading text-2xl font-extrabold">
                  No matching products
                </h2>

                <p className="mt-2 text-sm text-stone-500 dark:text-slate-400">
                  Try another product type or search term.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map(
                  (product) => {
                    const available =
                      availableStock(
                        product,
                      );

                    const soldOut =
                      available !== null &&
                      available <= 0;

                    return (
                      <article
                        key={
                          product.productId
                        }
                        className={`lux-product-card group ${soldOut ? "saturate-[.65]" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/product/${product.productId}`,
                            )
                          }
                          className="lux-product-media block w-full"
                        >
                          <ProductVisual
                            product={product}
                            className="transition duration-500 group-hover:scale-[1.03]"
                          />
                        </button>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                                {product.type ||
                                  product.category}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/product/${product.productId}`,
                                  )
                                }
                                className="mt-1 block text-left"
                              >
                                <h2 className="line-clamp-2 font-heading text-lg font-extrabold leading-tight transition group-hover:text-indigo-600">
                                  {
                                    product.name
                                  }
                                </h2>
                              </button>

                              <p className="mt-1 text-xs text-stone-400">
                                {
                                  product.brand
                                }
                              </p>
                            </div>

                            {product.badge && (
                              <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                                {
                                  product.badge
                                }
                              </span>
                            )}
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-3">
                            <div>
                              <p className="font-heading text-2xl font-extrabold">
                                {fmt(
                                  product.price,
                                )}
                              </p>

                              {product.originalPrice >
                                product.price && (
                                <p className="mt-0.5 text-xs text-stone-400 line-through">
                                  {fmt(
                                    product.originalPrice,
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-semibold text-[var(--lux-muted)]">
                                Rating{" "}
                                {Number(
                                  product.rating ||
                                    0,
                                ).toFixed(
                                  1,
                                )}
                              </p>

                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  soldOut
                                    ? "lux-stock-out"
                                    : available !==
                                        null &&
                                      available <=
                                        5
                                      ? "lux-stock-low"
                                      : "lux-stock-ok"
                                }`}
                              >
                                {available ===
                                null
                                  ? "Available"
                                  : soldOut
                                    ? "Out of stock · wait for restock"
                                    : `${available} available`}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/product/${product.productId}`,
                                )
                              }
                              className="min-h-11 rounded-xl border border-[var(--lux-line)] px-3 text-xs font-bold text-[var(--lux-ink)] transition hover:bg-[var(--lux-soft)]"
                            >
                              Details
                            </button>

                            <button
                              type="button"
                              disabled={
                                soldOut ||
                                addingId ===
                                  product.productId
                              }
                              onClick={() =>
                                addToCart(
                                  product,
                                )
                              }
                              className="min-h-11 rounded-xl bg-[var(--lux-ink)] px-3 text-xs font-bold text-[var(--lux-bg)] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {addingId ===
                              product.productId
                                ? "Adding…"
                                : soldOut
                                  ? "Sold out"
                                  : "Add to cart"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
        </section>
      </main>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() =>
          setCartOpen(false)
        }
        cart={cart}
        cartCount={cartCount}
        cartTotal={cartTotal}
        updateQty={updateQty}
        removeFromCart={
          removeFromCart
        }
      />
    </div>
  );
}
