import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import ProductVisual from "../components/ProductVisual";

import { auth } from "../auth/firebase";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { fmt } from "../utils/formatters";
import {
  API_URL,
  APP_NAME,
} from "../config/app";

const RAZORPAY_KEY =
  import.meta.env
    .VITE_RAZORPAY_KEY_ID ||
  "";

function useRazorpayScript() {
  const [status, setStatus] =
    useState(
      window.Razorpay
        ? "loaded"
        : "loading",
    );

  useEffect(() => {
    if (
      window.Razorpay
    ) {
      setStatus("loaded");
      return;
    }

    const existing =
      document.querySelector(
        'script[data-shopora-razorpay="true"]',
      );

    if (existing) {
      const handleLoad =
        () =>
          setStatus(
            "loaded",
          );

      const handleError =
        () =>
          setStatus(
            "failed",
          );

      existing.addEventListener(
        "load",
        handleLoad,
      );

      existing.addEventListener(
        "error",
        handleError,
      );

      return () => {
        existing.removeEventListener(
          "load",
          handleLoad,
        );

        existing.removeEventListener(
          "error",
          handleError,
        );
      };
    }

    const script =
      document.createElement(
        "script",
      );

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.dataset.shoporaRazorpay =
      "true";

    script.onload = () =>
      setStatus("loaded");

    script.onerror = () =>
      setStatus("failed");

    document.body.appendChild(
      script,
    );

    return () => {
      // Keep the provider script cached for the session.
    };
  }, []);

  return status;
}

export default function PaymentPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const razorpayStatus =
    useRazorpayScript();

  const errorRef =
    useRef(null);

  const [paying, setPaying] =
    useState(false);

  const [demoPaying, setDemoPaying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    providerConfig,
    setProviderConfig,
  ] = useState({
    configured: false,
    mode:
      "unconfigured",
  });

  const [
    serverPricing,
    setServerPricing,
  ] = useState(null);

  const {
    items = [],
    total:
      clientTotal = 0,
    subtotal:
      clientSubtotal = 0,
    discountAmt:
      clientDiscountAmount = 0,
    discountPercent:
      clientDiscountPercent = 0,
    address = null,
  } = location.state || {};

  const isDevelopment =
    import.meta.env.MODE ===
    "development";

  const busy =
    paying ||
    demoPaying;

  useEffect(() => {
    document.title =
      `Payment | ${APP_NAME}`;

    window.scrollTo(
      0,
      0,
    );

    fetch(
      `${API_URL}/api/payment/config`,
    )
      .then(
        (response) =>
          response.json(),
      )
      .then(
        (data) =>
          setProviderConfig({
            configured:
              Boolean(
                data.configured,
              ),
            mode:
              data.mode ||
              "unconfigured",
          }),
      )
      .catch(() => {
        setProviderConfig({
          configured: false,
          mode:
            "unconfigured",
        });
      });
  }, []);

  useEffect(() => {
    if (
      !items.length ||
      !address?.id
    ) {
      navigate(
        "/checkout",
        {
          replace: true,
        },
      );
    }
  }, [
    items.length,
    address?.id,
    navigate,
  ]);

  if (
    !items.length ||
    !address?.id
  ) {
    return null;
  }

  const visibleSubtotal =
    serverPricing?.subtotal ??
    clientSubtotal;

  const visibleDiscount =
    serverPricing
      ?.discountAmount ??
    clientDiscountAmount;

  const visibleDiscountPercent =
    serverPricing
      ?.discountPercent ??
    clientDiscountPercent;

  const visibleTotal =
    serverPricing?.total ??
    clientTotal;

  const showError =
    (message) => {
      setError(
        message,
      );

      window.setTimeout(
        () =>
          errorRef.current?.focus(),
        0,
      );
    };

  const finishOrder =
    ({
      order,
      paymentId,
      pricing,
    }) => {
      navigate(
        "/payment-confirmation",
        {
          state: {
            items,
            total:
              order?.total ??
              pricing?.total ??
              visibleTotal,

            subtotal:
              order?.subtotal ??
              pricing?.subtotal ??
              visibleSubtotal,

            discountAmt:
              order
                ?.discountAmount ??
              pricing
                ?.discountAmount ??
              visibleDiscount,

            discountPercent:
              order
                ?.discountPercent ??
              pricing
                ?.discountPercent ??
              visibleDiscountPercent,

            discountApplied:
              Number(
                order
                  ?.discountAmount ??
                  pricing
                    ?.discountAmount ??
                  visibleDiscount,
              ) > 0,

            paymentId:
              order?.paymentId ||
              paymentId ||
              "",

            address:
              order
                ?.shippingAddress ||
              address,

            order,
            orderId:
              order?._id ||
              null,
          },
        },
      );
    };

  const createPaymentOrder =
    async () => {
      const user =
        auth.currentUser;

      if (!user) {
        navigate("/auth");
        return null;
      }

      const headers =
        await getAuthHeaders();

      const response =
        await fetch(
          `${API_URL}/api/payment/create-order`,
          {
            method: "POST",
            headers,
            credentials:
              "include",
            body:
              JSON.stringify({
                userId:
                  user.uid,

                addressId:
                  address.id,
              }),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () => ({}),
          );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to prepare payment",
        );
      }

      setServerPricing(
        data.pricing ||
          null,
      );

      return {
        user,
        ...data,
      };
    };

  const handlePay =
    async () => {
      if (
        razorpayStatus !==
        "loaded"
      ) {
        showError(
          "Razorpay Checkout is still loading. Please wait a moment and try again.",
        );
        return;
      }

      if (
        !RAZORPAY_KEY ||
        !providerConfig.configured
      ) {
        showError(
          "Razorpay test keys are not configured yet.",
        );
        return;
      }

      setPaying(true);
      setError("");

      try {
        const prepared =
          await createPaymentOrder();

        if (!prepared) {
          setPaying(false);
          return;
        }

        const {
          user,
          order,
          pricing,
        } = prepared;

        const options = {
          key:
            RAZORPAY_KEY,

          amount:
            order.amount,

          currency:
            order.currency,

          name:
            "Shopora",

          description:
            "Shopora product order",

          order_id:
            order.id,

          prefill: {
            name:
              user.displayName ||
              "",

            email:
              user.email ||
              "",
          },

          notes: {
            app:
              "Shopora",
          },

          theme: {
            color:
              "#1c1917",
          },

          handler:
            async (
              response,
            ) => {
              try {
                const headers =
                  await getAuthHeaders();

                const verifyResponse =
                  await fetch(
                    `${API_URL}/api/payment/verify-payment`,
                    {
                      method:
                        "POST",
                      headers,
                      credentials:
                        "include",

                      body:
                        JSON.stringify({
                          ...response,

                          userId:
                            user.uid,
                        }),
                    },
                  );

                const verifyData =
                  await verifyResponse
                    .json()
                    .catch(
                      () =>
                        ({}),
                    );

                if (
                  !verifyResponse.ok
                ) {
                  throw new Error(
                    verifyData.error ||
                      "Payment verification failed",
                  );
                }

                finishOrder({
                  order:
                    verifyData.order,

                  paymentId:
                    response
                      .razorpay_payment_id,

                  pricing,
                });
              } catch (
                verificationError
              ) {
                showError(
                  verificationError.message ||
                    "Payment could not be verified.",
                );

                setPaying(
                  false,
                );
              }
            },

          modal: {
            ondismiss:
              () => {
                setPaying(
                  false,
                );

                showError(
                  "Payment was cancelled. Your order has not been marked paid.",
                );
              },
          },
        };

        const checkout =
          new window.Razorpay(
            options,
          );

        checkout.on(
          "payment.failed",
          (response) => {
            setPaying(
              false,
            );

            showError(
              response
                .error
                ?.description ||
                "Razorpay reported a failed payment.",
            );
          },
        );

        checkout.open();
      } catch (
        paymentError
      ) {
        setPaying(false);

        showError(
          paymentError.message ||
            "Unable to start payment.",
        );
      }
    };

  const handleDemoSuccess =
    async () => {
      const user =
        auth.currentUser;

      if (!user) {
        navigate("/auth");
        return;
      }

      setDemoPaying(true);
      setError("");

      try {
        const headers =
          await getAuthHeaders();

        const response =
          await fetch(
            `${API_URL}/api/payment/demo-success`,
            {
              method: "POST",
              headers,
              credentials:
                "include",

              body:
                JSON.stringify({
                  userId:
                    user.uid,

                  addressId:
                    address.id,
                }),
            },
          );

        const data =
          await response
            .json()
            .catch(
              () => ({}),
            );

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Demo payment failed",
          );
        }

        setServerPricing(
          data.pricing ||
            null,
        );

        finishOrder({
          order:
            data.order,

          paymentId:
            data.paymentId,

          pricing:
            data.pricing,
        });
      } catch (
        demoError
      ) {
        showError(
          demoError.message ||
            "Demo payment failed.",
        );

        setDemoPaying(false);
      }
    };

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <Navbar
        variant="home"
      />

      <main className="shopora-store-enter mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              Secure checkout
            </p>

            <h1 className="font-heading mt-2 text-4xl font-extrabold tracking-tight">
              Payment
            </h1>
          </div>

          <div
            className={`w-fit rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              providerConfig.configured
                ? providerConfig.mode ===
                  "test"
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {providerConfig.configured
              ? `Razorpay ${providerConfig.mode}`
              : "Razorpay not configured"}
          </div>
        </div>

        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 outline-none dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="lux-admin-card p-5 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
              Items
            </p>

            <div className="mt-5 divide-y divide-stone-100 dark:divide-slate-800">
              {items.map(
                ({
                  product,
                  quantity,
                }) => (
                  <div
                    key={
                      product.productId
                    }
                    className="flex items-center gap-4 py-4 first:pt-0"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                      <ProductVisual
                        product={
                          product
                        }
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        Qty{" "}
                        {
                          quantity
                        }{" "}
                        ·{" "}
                        {fmt(
                          product.price,
                        )}
                      </p>
                    </div>

                    <p className="text-sm font-bold">
                      {fmt(
                        product.price *
                          quantity,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--lux-soft)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                Shipping to
              </p>

              <p className="mt-2 text-sm font-bold">
                {address.label ||
                  "Address"}
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-slate-400">
                {[
                  address.line1,
                  address.line2,
                  address.city,
                  address.state,
                  address.zip,
                  address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </section>

          <aside className="h-fit rounded-2xl bg-[#0f1115] p-6 text-white lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Order total
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-stone-400">
                <span>
                  Subtotal
                </span>

                <span>
                  {fmt(
                    visibleSubtotal,
                  )}
                </span>
              </div>

              {visibleDiscount >
                0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>
                    Welcome discount{" "}
                    {visibleDiscountPercent >
                    0
                      ? `(${visibleDiscountPercent}%)`
                      : ""}
                  </span>

                  <span>
                    −
                    {fmt(
                      visibleDiscount,
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-stone-400">
                <span>
                  Shipping
                </span>
                <span>
                  Free
                </span>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-end justify-between gap-4">
                <span className="font-semibold">
                  Total
                </span>

                <span className="font-heading text-3xl font-extrabold">
                  {fmt(
                    visibleTotal,
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={
                busy ||
                razorpayStatus !==
                  "loaded" ||
                !providerConfig.configured ||
                !RAZORPAY_KEY
              }
              onClick={
                handlePay
              }
              className="shopora-button-press mt-6 min-h-12 w-full rounded-xl bg-white px-5 text-sm font-bold text-stone-950 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {paying
                ? "Opening Razorpay…"
                : "Pay securely with Razorpay"}
            </button>

            {isDevelopment && (
              <button
                type="button"
                disabled={
                  busy
                }
                onClick={
                  handleDemoSuccess
                }
                className="shopora-button-press mt-3 min-h-11 w-full rounded-xl border border-white/15 px-5 text-xs font-semibold text-stone-300 transition hover:bg-white/5 disabled:opacity-45"
              >
                {demoPaying
                  ? "Creating demo order…"
                  : "Simulate success (development only)"}
              </button>
            )}

            <p className="mt-4 text-center text-[10px] leading-5 text-stone-500">
              Shopora never exposes the Razorpay secret in the browser. The backend verifies successful payments before creating a paid order.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
