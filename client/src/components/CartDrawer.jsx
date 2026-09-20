import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../utils/formatters";
import { BrandMark } from "./BrandLogo";
import ProductVisual from "./ProductVisual";

export default function CartDrawer({
  isOpen,
  onClose,
  cart = [],
  cartCount = 0,
  cartTotal = 0,
  updateQty,
  removeFromCart,
}) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        drawerRef.current?.querySelectorAll(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () =>
      document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;

    const trigger = triggerRef.current;

    if (trigger && typeof trigger.focus === "function") {
      trigger.focus();
    }
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-[9999] flex h-dvh w-full max-w-[420px] flex-col border-l border-[var(--lux-line)] bg-[var(--lux-surface)] shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-5 py-5 dark:border-slate-800 sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Your
            </p>
            <h2
              id="cart-drawer-title"
              className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-stone-950 dark:text-white"
            >
              Cart
              {cartCount > 0 && (
                <span className="ml-2 text-stone-400">· {cartCount}</span>
              )}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center rounded-full text-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-950 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <BrandMark size={64} />

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Nothing here yet
              </p>

              <h3 className="font-heading mt-2 text-2xl font-extrabold text-stone-950 dark:text-white">
                Your cart is empty
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500 dark:text-slate-400">
                Add a product from the Shopora catalog and it will appear here.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-7 rounded-full bg-stone-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-stone-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {cart.map((item) => (
                <article key={item.id} className="flex gap-4 py-5">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--lux-line)] bg-[var(--lux-soft)]">
                    <ProductVisual product={item} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {item.brand && (
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        {item.brand}
                      </p>
                    )}
                    <p className="mt-1 truncate text-sm font-bold text-stone-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600 dark:text-slate-300">
                      {fmt(item.price)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-[11px] font-semibold text-stone-400 transition hover:text-rose-600"
                    >
                      Remove
                    </button>

                    <div className="flex items-center rounded-full border border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name}`}
                        onClick={() => updateQty(item.id, -1)}
                        className="grid h-8 w-8 place-items-center text-stone-500 transition hover:text-stone-950 dark:text-slate-300 dark:hover:text-white"
                      >
                        −
                      </button>

                      <span className="min-w-7 text-center text-xs font-bold text-stone-900 dark:text-white">
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name}`}
                        onClick={() => updateQty(item.id, 1)}
                        className="grid h-8 w-8 place-items-center text-stone-500 transition hover:text-stone-950 dark:text-slate-300 dark:hover:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-stone-200 px-5 py-5 dark:border-slate-800 sm:px-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Subtotal
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Shipping and final discounts are calculated at checkout.
                </p>
              </div>

              <p className="font-heading text-2xl font-extrabold text-stone-950 dark:text-white">
                {fmt(cartTotal)}
              </p>
            </div>

            <Link to="/checkout" onClick={onClose} className="mt-5 block">
              <span className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--lux-ink)] px-6 text-sm font-bold text-[var(--lux-bg)] transition hover:opacity-85">
                Checkout →
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-3 min-h-11 w-full rounded-xl border border-[var(--lux-line)] text-sm font-semibold text-[var(--lux-muted)] transition hover:bg-[var(--lux-soft)]"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
