import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../auth/firebase";
import { API_URL } from "../config/app";
import ProductImage from "./ProductImage";

const STATIC_COMMANDS = [
  {
    id: "shop",
    title: "Shop all products",
    subtitle: "Browse the Shopora catalog",
    route: "/shop",
    keywords: "shop products catalog store",
    icon: "S",
  },
  {
    id: "health",
    title: "BMI & TDEE tools",
    subtitle: "Open Shopora health tools",
    route: "/home#health-tools",
    keywords: "bmi tdee calorie health calculator",
    icon: "H",
  },
  {
    id: "membership",
    title: "Shopora Membership",
    subtitle: "Starter, Pro and Elite",
    route: "/home#membership",
    keywords: "membership starter pro elite rewards",
    icon: "M",
  },
  {
    id: "weight-loss",
    title: "Weight Loss Plan",
    subtitle: "12-week structured plan",
    route: "/plans/weight-loss",
    keywords: "weight loss fitness plan",
    icon: "W",
  },
  {
    id: "muscle",
    title: "Muscle Building Plan",
    subtitle: "16-week structured plan",
    route: "/plans/muscle-building",
    keywords: "muscle building strength fitness plan",
    icon: "B",
  },
  {
    id: "mobility",
    title: "Mobility & Recovery",
    subtitle: "8-week movement plan",
    route: "/plans/mobility-recovery",
    keywords: "mobility recovery flexibility plan",
    icon: "R",
  },
];

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export default function CommandPalette({
  transparent = false,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] =
    useState(false);
  const [loadingProducts, setLoadingProducts] =
    useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(() => {
    const base = [...STATIC_COMMANDS];

    if (auth.currentUser) {
      base.push(
        {
          id: "profile",
          title: "My profile",
          subtitle: "Orders, addresses and rewards",
          route: "/profile",
          keywords: "profile account orders addresses rewards",
          icon: "P",
        },
        {
          id: "tracker",
          title: "Workout tracker",
          subtitle: "Open your training tracker",
          route: "/tracker",
          keywords: "workout tracker training",
          icon: "T",
        },
      );
    } else {
      base.push({
        id: "signin",
        title: "Sign in",
        subtitle: "Access your Shopora account",
        route: "/auth",
        keywords: "login sign in account google",
        icon: "A",
      });
    }

    return base;
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const commandK =
        (event.ctrlKey || event.metaKey) &&
        (event.code === "KeyK" ||
          event.key.toLowerCase() === "k");

      const slashShortcut =
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTyping;

      if (commandK || slashShortcut) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () =>
      window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    if (productsLoaded || loadingProducts) return;

    let active = true;
    setLoadingProducts(true);

    fetch(`${API_URL}/api/products?all=true`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!active) return;

        const list = Array.isArray(payload)
          ? payload
          : payload?.products || payload?.data || [];

        setProducts(list);
        setProductsLoaded(true);
      })
      .catch((error) => {
        console.error(
          "Quick Find product load failed:",
          error,
        );
        if (active) {
          setProducts([]);
          setProductsLoaded(true);
        }
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [open, productsLoaded, loadingProducts]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const commandResults = commands
      .filter((command) => {
        if (!normalized) return true;

        return [
          command.title,
          command.subtitle,
          command.keywords,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .map((command) => ({
        ...command,
        type: "page",
      }));

    const productResults = normalized
      ? products
          .filter((product) =>
            [
              product.name,
              product.brand,
              product.category,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(normalized),
          )
          .slice(0, 6)
          .map((product) => ({
            id: `product-${
              product.productId || product.id
            }`,
            title: product.name,
            subtitle: [
              product.brand,
              product.category,
            ]
              .filter(Boolean)
              .join(" - "),
            route: `/product/${
              product.productId || product.id
            }`,
            icon: "Go",
            type: "product",
            product,
          }))
      : [];

    return [
      ...commandResults.slice(0, normalized ? 5 : 8),
      ...productResults,
    ].slice(0, 10);
  }, [commands, products, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex <= results.length - 1) return;
    setActiveIndex(Math.max(0, results.length - 1));
  }, [activeIndex, results.length]);

  const choose = (item) => {
    if (!item) return;

    setOpen(false);
    navigate(item.route);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length
          ? (current + 1) % results.length
          : 0,
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length
          ? (current - 1 + results.length) %
            results.length
          : 0,
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Quick Find"
        title="Quick Find — Ctrl/Cmd+K or /"
        className={`group inline-flex h-10 items-center gap-2 rounded-xl border px-2.5 text-xs font-semibold transition sm:px-3 ${
          transparent
            ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
        }`}
      >
        <SearchIcon />
        <span className="hidden lg:inline">Quick find</span>
        <kbd
          className={`hidden rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-medium lg:inline ${
            transparent
              ? "border-white/15 bg-white/10 text-white/70"
              : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-950"
          }`}
        >
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center bg-slate-950/55 px-4 pt-[12vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shopora Quick Find"
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800 sm:px-5">
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search products, plans, tools..."
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-400 dark:border-slate-700"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(item)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    activeIndex === index
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {item.type === "product" ? (
                    <ProductImage product={item.product} className="h-9 w-9 shrink-0 rounded-xl" />
                  ) : <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                      item.type === "product"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                    }`}
                  >
                    {item.icon}
                  </span>}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {item.subtitle}
                    </span>
                  </span>

                  <span className="text-xs text-slate-300">Enter</span>
                </button>
              ))}

              {loadingProducts && query && (
                <div className="px-4 py-5 text-center text-xs text-slate-400">
                  Loading products...
                </div>
              )}

              {!loadingProducts && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No results
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Try a product, plan or Shopora tool.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[10px] text-slate-400 dark:border-slate-800 dark:bg-slate-950/60 sm:px-5">
              <span>Up Down navigate - Enter open - Esc close</span>
              <span>Shopora Quick Find</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
