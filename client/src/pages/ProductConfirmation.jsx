// src/pages/ProductConfirmation.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fmt } from "../utils/formatters";

export default function ProductConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const {
    items = [],
    total = 0,
    subtotal = total,
    discountAmt = 0,
    discountPercent = 0,
    discountApplied = false,
    paymentId = "",
    address = null,
    order = null,
    orderId = order?._id || null,
  } = location.state || {};

  useEffect(() => {
    document.title = "Shopora";
  }, []);

  const now = new Date();

  const currentOrderDate = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentOrderTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!items.length) navigate("/");
  }, [items, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!items.length) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <style>{`
        .fade-up {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .delay-1 { transition-delay: 0.12s; }
        .delay-2 { transition-delay: 0.26s; }
        .delay-3 { transition-delay: 0.40s; }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-5 sm:py-16">
        <div className={`fade-up ${visible ? "visible" : ""} mb-10 text-center sm:mb-12`}>
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 shadow-lg shadow-indigo-600/20 sm:mb-6 sm:h-20 sm:w-20">
            <span className="text-2xl font-bold text-white sm:text-3xl">✓</span>
          </div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-indigo-500">
            Order Confirmed
          </p>
          <h1 className="font-heading mb-3 text-3xl font-extrabold leading-tight text-slate-950 dark:text-white sm:text-4xl md:text-5xl">
            Payment Successful
          </h1>
          <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">
            Thank you for shopping with Shopora.
          </p>
          <p className="text-xs text-slate-400">
            {currentOrderDate} &middot; {currentOrderTime}
          </p>
          {paymentId && (
            <p className="mt-2 inline-block max-w-full break-all rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-400 dark:bg-slate-900">
              {paymentId}
            </p>
          )}
        </div>

        <div className={`shopora-premium-card fade-up delay-1 ${visible ? "visible" : ""} mb-4 overflow-hidden rounded-3xl`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-7 sm:py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Items Purchased
            </p>
            <p className="text-xs text-slate-400">
              {items.length} item{items.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(({ product, quantity }) => (
              <div
                key={product.productId || product.id}
                className="flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5"
              >
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-16 sm:w-16">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    {product.brand}
                  </p>
                  <p className="font-heading truncate text-base font-bold leading-tight text-slate-950 dark:text-white sm:text-lg">
                    {product.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 sm:gap-3">
                    <span>Qty {quantity}</span>
                    <span className="hidden text-slate-200 sm:inline">&middot;</span>
                    <span>{fmt(product.price)} each</span>
                  </div>
                </div>

                <p className="font-heading flex-shrink-0 text-lg font-extrabold text-slate-950 dark:text-white sm:text-xl">
                  {fmt(product.price * quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/70 sm:px-7 sm:py-5">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {discountApplied && (
              <div className="mt-2 flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>Discount {discountPercent ? `(${discountPercent}%)` : ""}</span>
                <span>-{fmt(discountAmt)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Paid</span>
              <span className="font-heading text-2xl font-extrabold text-slate-950 dark:text-white sm:text-3xl">
                {fmt(total)}
              </span>
            </div>
          </div>
        </div>

        <div className={`fade-up delay-2 ${visible ? "visible" : ""} flex flex-col gap-3 sm:flex-row`}>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Continue shopping
          </button>

          {orderId && (
            <button
              type="button"
              onClick={() =>
                navigate(`/invoice/payment/${orderId}`, {
                  state: {
                    order,
                    items,
                    total,
                    subtotal,
                    discountAmt,
                    discountPercent,
                    discountApplied,
                    paymentId,
                    address,
                  },
                })
              }
              className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              View invoice
            </button>
          )}
        </div>

        <p className={`fade-up delay-3 ${visible ? "visible" : ""} mt-6 px-4 text-center text-xs leading-relaxed text-slate-400 sm:mt-8`}>
          A confirmation will be sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
