import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  API_URL,
} from "../config/app";

import {
  fmt,
} from "../utils/formatters";

import ProductVisual from "./ProductVisual";
import CategoryPhotoRail from "./CategoryPhotoRail";

const CAMPAIGNS = [
  {
    id: "strength",
    eyebrow:
      "SHOPORA / PERFORMANCE",
    title:
      "Train with intent.",
    copy:
      "Performance essentials, structured fitness tools and a store built around the work you actually do.",
    image:
      "/campaign/hero-dark-gym.jpg",
    position:
      "center 44%",
    cta:
      "Shop training",
    route:
      "/shop",
  },

  {
    id: "equipment",
    eyebrow:
      "SHOPORA / ESSENTIALS",
    title:
      "Less noise. Better gear.",
    copy:
      "Training equipment, nutrition and wearables with live inventory and a checkout flow that stays focused.",
    image:
      "/products/real/resistance-bands-1.jpg",
    position:
      "center 54%",
    cta:
      "Explore products",
    route:
      "/shop",
  },

  {
    id: "space",
    eyebrow:
      "SHOPORA / TRAINING",
    title:
      "Build your space.",
    copy:
      "From compact home sessions to full gym training, keep products, plans and health tools in one place.",
    image:
      "/campaign/premium-gym.jpg",
    position:
      "center",
    cta:
      "Explore plans",
    route:
      "/home#plans",
  },
];

const COLLECTIONS = [
  {
    title:
      "Training essentials",
    eyebrow:
      "EQUIPMENT",
    copy:
      "Ropes, resistance and compact tools for everyday training.",
    image:
      "/campaign/training-flatlay.jpg",
    route:
      "/shop?category=Training%20Gear",
  },

  {
    title:
      "Performance nutrition",
    eyebrow:
      "NUTRITION",
    copy:
      "Protein powders and bars selected for a simple training routine.",
    image:
      "/products/real/protein-powder-1.jpg",
    route:
      "/shop?category=Nutrition",
  },

  {
    title:
      "Wearables + recovery",
    eyebrow:
      "TRACK + RECOVER",
    copy:
      "Wearables and practical tools that keep your routine connected.",
    image:
      "/products/real/fitness-tracker-1.jpg",
    route:
      "/shop?category=Wearables",
  },
];

function CampaignImage({
  src,
  alt,
  className = "",
  position =
    "center",
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-[#17191d] ${className}`}
    >
      {!failed && (
        <img
          src={src}
          alt={alt}
          onError={() =>
            setFailed(true)
          }
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition:
              position,
          }}
        />
      )}

      {failed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(255,92,53,.20),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(18,191,163,.13),transparent_30%),#111316]" />
      )}
    </div>
  );
}

function Icon({
  type,
}) {
  if (
    type === "secure"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2m-11 0h12v10H6V10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (
    type === "stock"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M4 7l8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M3 12h14m0 0-4-4m4 4-4 4M5 7H3v10h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EditorialCampaignHome() {
  const navigate =
    useNavigate();

  const [
    active,
    setActive,
  ] = useState(0);

  const [
    paused,
    setPaused,
  ] = useState(false);

  const [
    products,
    setProducts,
  ] = useState([]);

  useEffect(() => {
    let alive = true;

    fetch(
      `${API_URL}/api/products?all=true`,
    )
      .then(
        (response) => {
          if (
            !response.ok
          ) {
            throw new Error(
              "Catalog unavailable",
            );
          }

          return response.json();
        },
      )
      .then(
        (payload) => {
          if (!alive) {
            return;
          }

          setProducts(
            Array.isArray(
              payload,
            )
              ? payload
              : payload?.data ||
                  [],
          );
        },
      )
      .catch(() => {
        if (alive) {
          setProducts([]);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (value) =>
              (value + 1) %
              CAMPAIGNS.length,
          );
        },
        6500,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [paused]);

  const featured =
    useMemo(
      () =>
        products
          .filter(
            (product) => {
              if (
                product.stock ===
                null
              ) {
                return true;
              }

              return (
                Number(
                  product.stock ||
                    0,
                ) -
                  Number(
                    product.reserved ||
                      0,
                  ) >
                0
              );
            },
          )
          .slice(0, 4),
      [products],
    );

  const campaign =
    CAMPAIGNS[active];

  return (
    <main className="campaign-page">
      <section
        className="campaign-hero"
        onMouseEnter={() =>
          setPaused(true)
        }
        onMouseLeave={() =>
          setPaused(false)
        }
      >
        {CAMPAIGNS.map(
          (
            item,
            index,
          ) => (
            <CampaignImage
              key={
                item.id
              }
              src={
                item.image
              }
              alt=""
              position={
                item.position
              }
              className={`campaign-hero-image ${
                active ===
                index
                  ? "campaign-hero-image-active"
                  : ""
              }`}
            />
          ),
        )}

        <div className="campaign-hero-shade" />

        <div className="campaign-shell campaign-hero-content">
          <div className="max-w-[710px]">
            <p className="campaign-eyebrow text-white/65">
              {
                campaign.eyebrow
              }
            </p>

            <h1
              key={
                campaign.title
              }
              className="campaign-title campaign-copy-enter"
            >
              {
                campaign.title
              }
            </h1>

            <p
              key={
                campaign.copy
              }
              className="campaign-lead campaign-copy-enter"
            >
              {
                campaign.copy
              }
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    campaign.route,
                  )
                }
                className="campaign-btn campaign-btn-light"
              >
                {
                  campaign.cta
                }
                <span
                  aria-hidden="true"
                >
                  →
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/home#health-tools",
                  )
                }
                className="campaign-btn campaign-btn-ghost"
              >
                Health tools
              </button>
            </div>
          </div>

          <div className="campaign-hero-progress">
            {CAMPAIGNS.map(
              (
                item,
                index,
              ) => (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    setActive(
                      index,
                    )
                  }
                  aria-label={`Show campaign ${index + 1}`}
                  className={`campaign-progress-button ${
                    active ===
                    index
                      ? "campaign-progress-active"
                      : ""
                  }`}
                >
                  <span>
                    0
                    {index + 1}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <CategoryPhotoRail />

      <section className="campaign-trust">
        <div className="campaign-shell campaign-trust-grid">
          <article>
            <Icon type="secure" />
            <div>
              <h2>
                Server-verified
                payment
              </h2>
              <p>
                Razorpay
                verification
                happens before
                an order is
                marked paid.
              </p>
            </div>
          </article>

          <article>
            <Icon type="stock" />
            <div>
              <h2>
                Live inventory
              </h2>
              <p>
                Product stock
                and cart
                reservations
                stay connected
                to MongoDB.
              </p>
            </div>
          </article>

          <article>
            <Icon type="flow" />
            <div>
              <h2>
                Focused checkout
              </h2>
              <p>
                Product, cart,
                address,
                payment and
                invoice in one
                clear flow.
              </p>
            </div>
          </article>
        </div>
      </section>

      <div className="shopora-category-ticker">
        {["Protein", "Training", "Recovery", "Hydration", "Wearables"].map((item) => <span key={item}>{item}</span>)}
      </div>

      <section className="campaign-section">
        <div className="campaign-shell">
          <div className="campaign-heading-row">
            <div>
              <p className="campaign-eyebrow">
                SHOP BY FOCUS
              </p>

              <h2 className="campaign-section-title">
                Your routine,
                built in.
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/shop",
                )
              }
              className="campaign-text-link"
            >
              View all products
              →
            </button>
          </div>

          <div className="campaign-collection-grid">
            {COLLECTIONS.map(
              (
                item,
                index,
              ) => (
                <button
                  type="button"
                  key={
                    item.title
                  }
                  onClick={() =>
                    navigate(
                      item.route,
                    )
                  }
                  className={`campaign-collection-card campaign-card-${index + 1} group`}
                >
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 motion-reduce:transition-none motion-safe:group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,5,6,0.90)_0%,rgba(4,5,6,0.48)_45%,rgba(4,5,6,0.08)_100%)]" />

                  <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-7">
                    <p className="campaign-eyebrow text-white/60">
                      {
                        item.eyebrow
                      }
                    </p>

                    <h3>
                      {
                        item.title
                      }
                    </h3>

                    <p>
                      {
                        item.copy
                      }
                    </p>

                    <span>
                      Explore
                      <b>
                        →
                      </b>
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="campaign-editorial">
        <div className="campaign-shell campaign-editorial-grid">
          <div className="campaign-editorial-copy">
            <p className="campaign-eyebrow">
              BUILT AROUND
              TRAINING
            </p>

            <h2 className="campaign-section-title">
              One fitness
              workspace.
              <br />
              No extra noise.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--lux-muted)]">
              Shopora keeps
              products,
              structured plans,
              health tools,
              membership and
              training progress
              together without
              turning the
              experience into a
              crowded dashboard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/home#plans",
                  )
                }
                className="campaign-btn campaign-btn-dark"
              >
                Fitness plans
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/tracker",
                  )
                }
                className="campaign-outline-btn"
              >
                Open tracker
              </button>
            </div>
          </div>

          <CampaignImage
            src="/campaign/premium-gym.jpg"
            alt="Modern fitness training space"
            className="campaign-editorial-image"
            position="center"
          />
        </div>
      </section>

      {featured.length >
        0 && (
        <section className="campaign-section campaign-featured">
          <div className="campaign-shell">
            <div className="campaign-heading-row">
              <div>
                <p className="campaign-eyebrow">
                  IN STOCK NOW
                </p>

                <h2 className="campaign-section-title">
                  Shop the edit.
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/shop",
                  )
                }
                className="campaign-text-link"
              >
                Full store →
              </button>
            </div>

            <div className="campaign-product-grid">
              {featured.map(
                (
                  product,
                  index,
                ) => (
                  <button
                    type="button"
                    key={
                      product.productId
                    }
                    onClick={() =>
                      navigate(
                        `/product/${product.productId}`,
                      )
                    }
                    className="campaign-product-card"
                  >
                    <div className="campaign-product-media">
                      <ProductVisual
                        product={
                          product
                        }
                        className="transition duration-500 group-hover:scale-[1.025]"
                      />

                      <span className="campaign-product-index">
                        0
                        {index + 1}
                      </span>
                    </div>

                    <div className="campaign-product-info">
                      <div>
                        <p>
                          {
                            product.type
                          }
                        </p>

                        <h3>
                          {
                            product.name
                          }
                        </h3>
                      </div>

                      <strong>
                        {fmt(
                          product.price,
                        )}
                      </strong>
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      <section className="campaign-confidence">
        <div className="campaign-shell">
          <div className="campaign-confidence-grid">
            <div className="campaign-confidence-copy">
              <p className="campaign-eyebrow text-white/45">
                SHOPORA STANDARD
              </p>

              <h2>
                Buy with
                confidence.
              </h2>

              <p>
                Real stock
                states, secure
                checkout and a
                clear purchase
                history.
              </p>
            </div>

            <div className="campaign-confidence-items">
              <article>
                <span>
                  01
                </span>
                <h3>
                  Live stock
                </h3>
                <p>
                  Know when an
                  item is
                  available,
                  low or waiting
                  for restock.
                </p>
              </article>

              <article>
                <span>
                  02
                </span>
                <h3>
                  Secure payment
                </h3>
                <p>
                  Razorpay
                  checkout with
                  backend
                  verification.
                </p>
              </article>

              <article>
                <span>
                  03
                </span>
                <h3>
                  Order history
                </h3>
                <p>
                  Review orders
                  and open
                  invoices from
                  your account.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
