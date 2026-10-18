import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../auth/useAuth";
import ThemeToggle from "./ThemeToggle";
import CommandPalette from "./CommandPalette";
import BrandLogo from "./BrandLogo";
import PremiumMoreMenu from "./PremiumMoreMenu";

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export default function Navbar({
  variant = "landing",
  onSearchToggle,
  cartCount = 0,
  onCartOpen,
  menuOpen,
  setMenuOpen,
  onSignOut,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { user, loading: authLoading, logout } = useAuth();
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const isLanding = variant === "landing";
  const effectiveMenuOpen =
    typeof setMenuOpen === "function" ? Boolean(menuOpen) : localMenuOpen;

  const setOpen = (value) => {
    if (typeof setMenuOpen === "function") setMenuOpen(value);
    else setLocalMenuOpen(value);
  };

  const handleSignOut = async () => {
    if (onSignOut) await onSignOut();
    else {
      await logout();
      navigate("/");
    }
    setOpen(false);
  };

  const goMobile = (route) => {
    setMobileMenuOpen(false);
    navigate(route);
  };

  const goToHomeSection = (sectionId) => {
    setMobileMenuOpen(false);
    const hash = `#${sectionId}`;
    navigate(`/home${hash}`);
    if (location.pathname === "/home") {
      window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  };

  return (
    <header className={`lux-header shopora-premium-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="shopora-topline" />
      <div className="lux-header-inner shopora-premium-inner">
        <div className="shopora-wordmark"><BrandLogo /></div>

        <nav className="shopora-nav hidden items-center justify-center gap-1 md:flex">
          <button type="button" onClick={() => navigate("/shop")} aria-current={location.pathname === "/shop" || location.pathname.startsWith("/product/") ? "page" : undefined} className="lux-nav-link shopora-nav-item">
            Shop
          </button>

          <button type="button" onClick={() => goToHomeSection("plans")} aria-current={location.pathname.startsWith("/plans/") || (location.pathname === "/home" && location.hash === "#plans") ? "page" : undefined} className="lux-nav-link shopora-nav-item">
            Fitness Plans
          </button>

          <button type="button" onClick={() => goToHomeSection("health-tools")} aria-current={location.pathname === "/exercises" || (location.pathname === "/home" && location.hash === "#health-tools") ? "page" : undefined} className="lux-nav-link shopora-nav-item hidden xl:block">
            Health Tools
          </button>

          <button type="button" onClick={() => navigate("/tracker")} aria-current={location.pathname === "/tracker" ? "page" : undefined} className="lux-nav-link shopora-nav-item hidden xl:block">
            Tracker
          </button>

          <PremiumMoreMenu />
        </nav>

        <div className="shopora-header-actions flex items-center justify-end gap-1.5">
          <div className="shopora-command-trigger">
            <CommandPalette transparent={false} />
          </div>

          <ThemeToggle className="" />

          {onSearchToggle && (
            <button
              type="button"
              onClick={onSearchToggle}
              aria-label="Toggle search"
              className="grid h-10 w-10 place-items-center rounded-xl text-[var(--lux-muted)] transition hover:bg-[var(--lux-soft)] hover:text-[var(--lux-ink)]"
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
            </button>
          )}

          {onCartOpen && (
            <button
              type="button"
              onClick={onCartOpen}
              aria-label={`Cart, ${cartCount} items`}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-[var(--lux-muted)] transition hover:bg-[var(--lux-soft)] hover:text-[var(--lux-ink)]"
            >
              <BagIcon />
              {cartCount > 0 && (
                <Motion.span key={cartCount} initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }} className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[var(--lux-orange)] px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </Motion.span>
              )}
            </button>
          )}

          {!authLoading &&
            (user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen(!effectiveMenuOpen)}
                  aria-expanded={effectiveMenuOpen}
                  aria-label="Account menu"
                  className="ml-1 flex h-10 items-center gap-2 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-2 text-[var(--lux-ink)] transition hover:bg-[var(--lux-soft)]"
                >
                  <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-100 to-emerald-100 text-xs font-bold text-indigo-700 dark:from-indigo-500/20 dark:to-emerald-500/20 dark:text-indigo-300">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "Account"}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()
                    )}
                  </span>
                  {!isLanding && (
                    <span className="hidden max-w-24 truncate text-xs sm:block">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                {effectiveMenuOpen && (
                  <>
                    <button
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setOpen(false)}
                      aria-label="Close account menu"
                    />
                    <Motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 5 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] shadow-xl shadow-black/10">
                      <div className="border-b border-[var(--lux-line)] px-4 py-3">
                        <p className="truncate text-sm font-semibold text-[var(--lux-ink)]">
                          {user.displayName || "Account"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-1.5">
                        {isLanding && (
                          <button
                            onClick={() => {
                              navigate("/shop");
                              setOpen(false);
                            }}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-indigo-500/10"
                          >
                            Shop products
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setOpen(false);
                          }}
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Profile & addresses
                        </button>
                        <button
                          onClick={() => {
                            navigate("/tracker");
                            setOpen(false);
                          }}
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Workout tracker
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          Sign out
                        </button>
                      </div>
                    </Motion.div>
                  </>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="shopora-auth-actions ml-1 flex items-center gap-2">
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--lux-muted)] hover:text-[var(--lux-ink)] sm:block"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="shopora-get-started rounded-xl bg-[var(--lux-ink)] px-4 py-2.5 text-xs font-semibold text-[var(--lux-bg)] transition hover:opacity-85 sm:text-sm"
                >
                  Get started
                </button>
              </div>
            ))}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
            className="grid h-10 w-10 place-items-center rounded-xl text-[var(--lux-muted)] transition hover:bg-[var(--lux-soft)] hover:text-[var(--lux-ink)] md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {mobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <Motion.button
            type="button"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="shopora-mobile-backdrop md:hidden"
          />
          <Motion.nav
            aria-label="Mobile navigation"
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 28 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="shopora-mobile-drawer md:hidden"
          >
            <div className="shopora-mobile-drawer-head">
              <span className="lux-eyebrow">SHOPORA / NAVIGATION</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">Close</button>
            </div>
            <div className="shopora-mobile-group">
              <p>SHOP</p>
              <button type="button" onClick={() => goMobile("/shop")} className="lux-mobile-nav-link">All products <span aria-hidden="true">&#8594;</span></button>
            </div>
            <div className="shopora-mobile-group">
              <p>TRAIN</p>
              <button type="button" onClick={() => goToHomeSection("plans")} className="lux-mobile-nav-link">Fitness Plans</button>
              <button type="button" onClick={() => goMobile("/plans/weight-loss")} className="lux-mobile-nav-link">Weight Loss</button>
              <button type="button" onClick={() => goMobile("/plans/muscle-building")} className="lux-mobile-nav-link">Muscle Building</button>
              <button type="button" onClick={() => goMobile("/plans/mobility-recovery")} className="lux-mobile-nav-link">Mobility & Recovery</button>
            </div>
            <div className="shopora-mobile-group">
              <p>TOOLS</p>
              <button type="button" onClick={() => goToHomeSection("health-tools")} className="lux-mobile-nav-link">Health Tools</button>
              <button type="button" onClick={() => goMobile("/exercises")} className="lux-mobile-nav-link">Exercises</button>
              <button type="button" onClick={() => goMobile("/tracker")} className="lux-mobile-nav-link">Workout Tracker</button>
            </div>
            <div className="shopora-mobile-group">
              <p>ACCOUNT</p>
              <button type="button" onClick={() => goToHomeSection("membership")} className="lux-mobile-nav-link">Membership</button>
              {user && <button type="button" onClick={() => goMobile("/profile")} className="lux-mobile-nav-link">Profile, rewards & orders</button>}
              {!user && <button type="button" onClick={() => goMobile("/auth")} className="lux-mobile-nav-link">Sign in</button>}
            </div>
          </Motion.nav>
        </>
      )}
      </AnimatePresence>
    </header>
  );
}
