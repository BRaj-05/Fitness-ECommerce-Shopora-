import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import CartDrawer from "../components/CartDrawer";
import ProductVisual from "../components/ProductVisual";
import ShoporaLoader from "../components/ShoporaLoader";
import SiteFooter from "../components/SiteFooter";
import SEOHead from "../components/SEOHead";
import { ArrowRight, Check, History, Minus, PackageCheck, Plus, ShieldCheck, Star } from "lucide-react";

import { useAuth } from "../auth/useAuth";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { fmt } from "../utils/formatters";
import { API_URL } from "../config/app";

function availableStock(product) {
  if (!product) return 0;

  if (product.stock === null) {
    return null;
  }

  return Math.max(
    0,
    Number(product.stock || 0) -
      Number(product.reserved || 0),
  );
}

function enrichCart(
  cartDoc,
  products,
) {
  return (cartDoc?.items || [])
    .map((item) => {
      const product =
        products.find(
          (entry) =>
            Number(
              entry.productId,
            ) ===
            Number(
              item.productId,
            ),
        );

      if (!product) {
        return null;
      }

      return {
        ...product,
        id: product.productId,
        qty: item.quantity,
      };
    })
    .filter(Boolean);
}

async function readError(
  response,
  fallback,
) {
  const data = await response
    .json()
    .catch(() => ({}));

  return (
    data.error ||
    fallback
  );
}

export default function ProductPage() {
  const { productId } =
    useParams();

  const navigate =
    useNavigate();

  const { user } = useAuth();

  const [product, setProduct] =
    useState(null);

  const [products, setProducts] =
    useState([]);

  const [cart, setCart] =
    useState([]);

  const [quantity, setQuantity] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  const [buying, setBuying] =
    useState(false);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("details");

  const cartCount =
    cart.reduce(
      (sum, item) =>
        sum + item.qty,
      0,
    );

  const cartTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price * item.qty,
      0,
    );

  const available =
    availableStock(product);

  const soldOut =
    available !== null &&
    available <= 0;

  const maxNewQuantity =
    available === null
      ? 20
      : Math.max(
          1,
          Math.min(
            20,
            available,
          ),
        );

  const discountPercent =
    product?.originalPrice >
    product?.price
      ? Math.round(
          ((product.originalPrice -
            product.price) /
            product.originalPrice) *
            100,
        )
      : 0;

  const related =
    useMemo(() => {
      if (!product) return [];

      const sameType =
        products.filter(
          (entry) =>
            entry.type ===
              product.type &&
            String(
              entry.productId,
            ) !==
              String(productId),
        );

      const sameCategory =
        products.filter(
          (entry) =>
            entry.category ===
              product.category &&
            entry.type !==
              product.type &&
            String(
              entry.productId,
            ) !==
              String(productId),
        );

      return [
        ...sameType,
        ...sameCategory,
      ].slice(0, 4);
    }, [
      product,
      products,
      productId,
    ]);

  const productSeo = useMemo(() => {
    if (!product) return [];
    const siteUrl = String(import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
    const productUrl = `${siteUrl}/product/${product.productId || product.id}`;
    const image = product.image ? new URL(product.image, `${siteUrl}/`).toString() : `${siteUrl}/logo.png`;
    return [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || product.name,
        image: [image],
        sku: String(product.productId || product.id),
        brand: { "@type": "Brand", name: product.brand || "Shopora" },
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "INR",
          price: Number(product.price || 0).toFixed(2),
          availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
          { "@type": "ListItem", position: 3, name: product.category || "Products", item: `${siteUrl}/shop?category=${encodeURIComponent(product.category || "All")}` },
          { "@type": "ListItem", position: 4, name: product.name, item: productUrl },
        ],
      },
    ];
  }, [product, soldOut]);

  const loadCart =
    useCallback(async (
      productList,
      currentUser = user,
    ) => {
      if (!currentUser) {
        setCart([]);
        return;
      }

      const headers =
        await getAuthHeaders();

      const response =
        await fetch(
          `${API_URL}/api/cart/${currentUser.uid}`,
          {
            headers,
            credentials:
              "include",
          },
        );

      if (!response.ok) {
        return;
      }

      const cartDoc =
        await response.json();

      setCart(
        enrichCart(
          cartDoc,
          productList,
        ),
      );
    }, [user]);

  const refreshCurrentProduct =
    async () => {
      const response =
        await fetch(
          `${API_URL}/api/products/${productId}`,
        );

      if (!response.ok) return;

      const fresh =
        await response.json();

      setProduct(fresh);

      setProducts(
        (current) =>
          current.map((entry) =>
            Number(
              entry.productId,
            ) ===
            Number(
              fresh.productId,
            )
              ? fresh
              : entry,
          ),
      );
    };

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    setQuantity(1);
    setError("");

    let active = true;

    const load = async () => {
      setLoading(true);

      try {
        const [
          productResponse,
          productsResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/api/products/${productId}`,
            ),

            fetch(
              `${API_URL}/api/products?all=true`,
            ),
          ]);

        if (
          !productResponse.ok
        ) {
          throw new Error(
            await readError(
              productResponse,
              "Product not found",
            ),
          );
        }

        if (
          !productsResponse.ok
        ) {
          throw new Error(
            "Unable to load catalog",
          );
        }

        const currentProduct =
          await productResponse.json();

        const allPayload =
          await productsResponse.json();

        const list =
          Array.isArray(
            allPayload,
          )
            ? allPayload
            : allPayload?.data ||
              [];

        if (!active) return;

        setProduct(
          currentProduct,
        );

        setProducts(list);

        document.title =
          `${currentProduct.name} | Shopora`;

        await loadCart(
          list,
          user,
        );
      } catch (loadError) {
        if (!active) return;

        setError(
          loadError.message ||
            "Unable to load product",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [
    productId,
    loadCart,
    user,
  ]);

  useEffect(() => {
    if (
      available !== null &&
      quantity > available
    ) {
      setQuantity(
        Math.max(
          1,
          available,
        ),
      );
    }
  }, [
    available,
    quantity,
  ]);

  const requireUser = () => {
    if (user) {
      return true;
    }

    navigate("/auth");
    return false;
  };

  const addToCart =
    async ({
      openCart = true,
      goCheckout = false,
    } = {}) => {
      if (!requireUser()) {
        return false;
      }

      if (!product) {
        return false;
      }

      if (
        soldOut ||
        quantity < 1
      ) {
        return false;
      }

      if (
        available !== null &&
        quantity > available
      ) {
        setError(
          `Only ${available} additional unit${
            available === 1
              ? ""
              : "s"
          } available.`,
        );

        return false;
      }

      const mode =
        goCheckout
          ? "buy"
          : "add";

      if (mode === "buy") {
        setBuying(true);
      } else {
        setAdding(true);
      }

      setError("");

      try {
        const headers =
          await getAuthHeaders();

        const response =
          await fetch(
            `${API_URL}/api/cart/${user.uid}/add`,
            {
              method: "POST",
              headers,
              credentials:
                "include",
              body:
                JSON.stringify({
                  productId:
                    product.productId,
                  quantity,
                }),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              "Unable to add product",
            ),
          );
        }

        const cartDoc =
          await response.json();

        setCart(
          enrichCart(
            cartDoc,
            products,
          ),
        );

        await refreshCurrentProduct();

        if (goCheckout) {
          navigate(
            "/checkout",
          );
        } else if (
          openCart
        ) {
          setCartOpen(true);
        }

        return true;
      } catch (addError) {
        setError(
          addError.message ||
            "Unable to update cart",
        );

        return false;
      } finally {
        setAdding(false);
        setBuying(false);
      }
    };

  const updateQty =
    async (
      id,
      delta,
    ) => {
      if (!user) return;

      try {
        const headers =
          await getAuthHeaders();

        const endpoint =
          delta > 0
            ? "add"
            : "remove";

        const response =
          await fetch(
            `${API_URL}/api/cart/${user.uid}/${endpoint}`,
            {
              method: "POST",
              headers,
              credentials:
                "include",
              body:
                JSON.stringify({
                  productId: id,
                  quantity:
                    Math.abs(
                      delta,
                    ),
                }),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              "Unable to update cart",
            ),
          );
        }

        const cartDoc =
          await response.json();

        setCart(
          enrichCart(
            cartDoc,
            products,
          ),
        );

        await refreshCurrentProduct();
      } catch (updateError) {
        setError(
          updateError.message ||
            "Unable to update cart",
        );
      }
    };

  const removeFromCart =
    async (id) => {
      if (!user) return;

      const item =
        cart.find(
          (entry) =>
            Number(
              entry.id,
            ) ===
            Number(id),
        );

      if (!item) return;

      try {
        const headers =
          await getAuthHeaders();

        const response =
          await fetch(
            `${API_URL}/api/cart/${user.uid}/remove`,
            {
              method: "POST",
              headers,
              credentials:
                "include",
              body:
                JSON.stringify({
                  productId: id,
                  quantity:
                    item.qty,
                }),
            },
          );

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              "Unable to remove item",
            ),
          );
        }

        const cartDoc =
          await response.json();

        setCart(
          enrichCart(
            cartDoc,
            products,
          ),
        );

        await refreshCurrentProduct();
      } catch (removeError) {
        setError(
          removeError.message ||
            "Unable to remove item",
        );
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950">
        <Navbar
          variant="home"
          cartCount={0}
        />

        <main className="shopora-wide-shell product-detail-layout grid gap-8 py-12 lg:grid-cols-2">
          <div className="shopora-skeleton aspect-square rounded-2xl" />

          <div className="space-y-5 py-5">
            <ShoporaLoader label="Loading product details" className="text-[var(--lux-muted)]" />
            <div className="shopora-skeleton h-3 w-32 rounded" />
            <div className="shopora-skeleton h-12 w-3/4 rounded-xl" />
            <div className="shopora-skeleton h-8 w-40 rounded" />
            <div className="shopora-skeleton h-28 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (
    error &&
    !product
  ) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950">
        <Navbar
          variant="home"
          cartCount={
            cartCount
          }
          onCartOpen={() =>
            setCartOpen(true)
          }
        />

        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-sm text-rose-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/shop")
            }
            className="shopora-button-press mt-6 rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
          >
            Back to shop
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <SEOHead
        title={`${product.name} | Shopora`}
        description={product.description || `Shop ${product.name} from ${product.brand || "Shopora"}.`}
        canonicalPath={`/product/${product.productId || product.id}`}
        image={product.image}
        type="product"
        jsonLd={productSeo}
      />
      <Navbar
        variant="home"
        cartCount={
          cartCount
        }
        onCartOpen={() =>
          setCartOpen(true)
        }
      />

      <main className="shopora-product-hero-enter">
        <div className="shopora-wide-shell py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--lux-muted)]">
            <button type="button" onClick={() => navigate("/")} className="hover:text-[var(--lux-ink)]">Home</button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => navigate("/shop")} className="hover:text-[var(--lux-ink)]">Shop</button>
            <span aria-hidden="true">/</span>
            <button type="button" onClick={() => navigate(`/shop?category=${encodeURIComponent(product.category || "All")}`)} className="hover:text-[var(--lux-ink)]">{product.category || "Products"}</button>
            <span aria-hidden="true">/</span>
            <span className="max-w-64 truncate text-[var(--lux-ink)]" aria-current="page">{product.name}</span>
          </nav>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          <section className="shopora-content-reveal grid gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="lux-product-card self-start">
              <div className="aspect-square">
                <ProductVisual
                  product={product}
                />
              </div>
            </div>

            <div className="flex flex-col justify-center lg:sticky lg:top-28 lg:self-start">
              <div className="flex flex-wrap items-center gap-2">
                {product.type && (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500 dark:bg-slate-800 dark:text-slate-300">
                    {
                      product.type
                    }
                  </span>
                )}

                {product.badge && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {
                      product.badge
                    }
                  </span>
                )}
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                {
                  product.brand ||
                  "Shopora"
                }
              </p>

              <h1 className="font-heading mt-2 text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl">
                {
                  product.name
                }
              </h1>

              <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2">
                <span className="font-heading text-3xl font-extrabold">
                  {fmt(
                    product.price,
                  )}
                </span>

                {product.originalPrice >
                  product.price && (
                  <span className="pb-1 text-sm text-stone-400 line-through">
                    {fmt(
                      product.originalPrice,
                    )}
                  </span>
                )}

                {discountPercent >
                  0 && (
                  <span className="mb-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {
                      discountPercent
                    }
                    % off
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold text-amber-600">
                  <Star size={15} className="mr-1 inline fill-current" />{" "}
                  {Number(
                    product.rating ||
                      0,
                  ).toFixed(1)}
                </span>

                <span className="text-stone-400">
                  {Number(
                    product.reviews ||
                      0,
                  ).toLocaleString(
                    "en-IN",
                  )}{" "}
                  reviews
                </span>
              </div>

              <p
                className={`mt-4 text-sm font-semibold ${
                  soldOut
                    ? "lux-stock-out"
                    : available !==
                          null &&
                        available <= 5
                      ? "lux-stock-low"
                      : "lux-stock-ok"
                }`}
              >
                {available ===
                null
                  ? "Available"
                  : soldOut
                    ? "Out of stock · wait for restock"
                    : `${available} unit${
                        available ===
                        1
                          ? ""
                          : "s"
                      } available`}
              </p>

              {product.description && (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600 dark:text-slate-300">
                  {
                    product.description
                  }
                </p>
              )}

              <div className="mt-7">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
                  Quantity
                </p>

                <div className="mt-2 flex w-fit items-center overflow-hidden rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)]">
                  <button
                    type="button"
                    disabled={
                      quantity <=
                      1
                    }
                    onClick={() =>
                      setQuantity(
                        (value) =>
                          Math.max(
                            1,
                            value - 1,
                          ),
                      )
                    }
                  className="grid h-11 w-11 place-items-center text-lg disabled:opacity-30"
                >
                    <Minus size={17} />
                  </button>

                  <span className="min-w-12 text-center text-sm font-bold">
                    {
                      quantity
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      soldOut ||
                      quantity >=
                        maxNewQuantity
                    }
                    onClick={() =>
                      setQuantity(
                        (value) =>
                          Math.min(
                            maxNewQuantity,
                            value + 1,
                          ),
                      )
                    }
                    className="grid h-11 w-11 place-items-center text-lg disabled:opacity-30"
                  >
                    <Plus size={17} />
                  </button>
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    soldOut ||
                    adding ||
                    buying
                  }
                  onClick={() =>
                    addToCart({
                      openCart:
                        true,
                    })
                  }
                  className="shopora-button-press flex min-h-13 items-center justify-center rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-6 text-sm font-bold text-[var(--lux-ink)] hover:bg-[var(--lux-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding
                    ? <ShoporaLoader label="Adding" size={16} />
                    : soldOut
                      ? "Out of stock"
                      : "Add to cart"}
                </button>

                <button
                  type="button"
                  disabled={
                    soldOut ||
                    adding ||
                    buying
                  }
                  onClick={() =>
                    addToCart({
                      openCart:
                        false,
                      goCheckout:
                        true,
                    })
                  }
                  className="shopora-button-press flex min-h-13 items-center justify-center rounded-xl bg-[var(--lux-ink)] px-6 text-sm font-bold text-[var(--lux-bg)] shadow-lg shadow-stone-950/10 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {buying
                    ? <ShoporaLoader label="Preparing checkout" size={16} />
                    : soldOut
                      ? "Out of stock"
                      : "Buy now"}
                </button>
              </div>

              <div className="mt-6 grid gap-3 text-xs sm:grid-cols-3">
                {[
                  [ShieldCheck, "Secure payment", "Razorpay is verified by the server."],
                  [PackageCheck, "Inventory verified", "Availability includes reserved stock."],
                  [History, "Order history", "Paid orders remain available in your account."],
                ].map(([Icon, title, copy]) => (
                  <div key={title} className="rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4">
                    {createElement(Icon, { size: 17, className: "text-[var(--lux-mint)]" })}
                    <p className="mt-3 font-bold text-[var(--lux-ink)]">{title}</p>
                    <p className="mt-1 leading-5 text-[var(--lux-muted)]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14">
            <div className="flex gap-6 border-b border-stone-200 dark:border-slate-800">
              {[
                [
                  "details",
                  "Details",
                ],
                [
                  "checkout",
                  "Purchase flow",
                ],
              ].map(
                ([
                  key,
                  label,
                ]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() =>
                      setActiveTab(
                        key,
                      )
                    }
                    className={`border-b-2 pb-3 text-sm font-semibold transition ${
                      activeTab ===
                      key
                        ? "border-stone-950 text-stone-950 dark:border-white dark:text-white"
                        : "border-transparent text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {
                      label
                    }
                  </button>
                ),
              )}
            </div>

            {activeTab ===
              "details" && (
              <div className="py-7">
                {product.description ? (
                  <p className="max-w-3xl text-sm leading-7 text-stone-600 dark:text-slate-300">
                    {
                      product.description
                    }
                  </p>
                ) : (
                  <p className="text-sm text-stone-500">
                    Product details are being prepared.
                  </p>
                )}

                {product
                  .highlights
                  ?.length >
                  0 && (
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {product.highlights.map(
                      (
                        highlight,
                      ) => (
                        <li
                          key={
                            highlight
                          }
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <Check size={14} className="mr-1 inline text-[var(--lux-mint)]" />{" "}
                          {
                            highlight
                          }
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            )}

            {activeTab ===
              "checkout" && (
              <div className="grid gap-3 py-7 sm:grid-cols-3">
                {[
                  [
                    "01",
                    "Add / Buy",
                    "Choose a quantity and add it to your authenticated cart.",
                  ],
                  [
                    "02",
                    "Review",
                    "Select a saved shipping address and review the server-backed order summary.",
                  ],
                  [
                    "03",
                    "Pay",
                    "Razorpay Checkout opens and the backend verifies the payment before creating the paid order.",
                  ],
                ].map(
                  ([
                    step,
                    title,
                    copy,
                  ]) => (
                    <div
                      key={
                        step
                      }
                      className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="text-[10px] font-bold text-stone-400">
                        {
                          step
                        }
                      </p>

                      <p className="mt-2 font-heading text-lg font-extrabold">
                        {
                          title
                        }
                      </p>

                      <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-slate-400">
                        {
                          copy
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          {related.length >
            0 && (
            <section className="mt-12 border-t border-stone-200 pt-10 dark:border-slate-800">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                    Continue browsing
                  </p>

                  <h2 className="font-heading mt-2 text-2xl font-extrabold">
                    Related products
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/shop",
                    )
                  }
                  className="text-xs font-bold text-stone-500 hover:text-stone-950 dark:hover:text-white"
                >
                  View all <ArrowRight size={14} className="ml-1 inline" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map(
                  (
                    item,
                    index,
                  ) => (
                    <button
                      type="button"
                      key={
                        item.productId
                      }
                      style={{
                        "--shopora-card-delay":
                          `${Math.min(
                            index,
                            4,
                          ) * 45}ms`,
                      }}
                      onClick={() =>
                        navigate(
                          `/product/${item.productId}`,
                        )
                      }
                      className="lux-product-card shopora-product-card-enter text-left"
                    >
                      <div className="aspect-square">
                        <ProductVisual
                          product={
                            item
                          }
                        />
                      </div>

                      <div className="p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-stone-400">
                          {
                            item.type
                          }
                        </p>

                        <p className="mt-1 line-clamp-2 font-heading text-base font-extrabold">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-3 font-heading text-lg font-extrabold">
                          {fmt(
                            item.price,
                          )}
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() =>
          setCartOpen(false)
        }
        cart={cart}
        cartCount={
          cartCount
        }
        cartTotal={
          cartTotal
        }
        updateQty={
          updateQty
        }
        removeFromCart={
          removeFromCart
        }
      />
    </div>
  );
}
