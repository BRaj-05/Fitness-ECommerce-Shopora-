import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useAuth } from "../auth/useAuth";
import { useAdminAccess } from "../auth/useAdminAccess";
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
  const { user, loading: authLoading } = useAuth();
  const {
    allowed: isAdmin,
  } = useAdminAccess();
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      await signOut(auth);
      navigate("/");
    }
    setOpen(false);
  };

  const goMobile = (route) => {
    setMobileMenuOpen(false);
    navigate(route);
  };

  return (
    <header className="lux-header shopora-premium-header">
      <div className="shopora-topline" />
      <div className="lux-header-inner shopora-premium-inner">
        <div className="shopora-wordmark"><BrandLogo /></div>

        <nav className="shopora-nav hidden items-center justify-center gap-1 md:flex">
          <button type="button" onClick={() => navigate("/shop")} className="lux-nav-link shopora-nav-item">
            Shop
          </button>

          <button type="button" onClick={() => navigate("/home#plans")} className="lux-nav-link shopora-nav-item">
            Fitness Plans
          </button>

          <button type="button" onClick={() => navigate("/home#health-tools")} className="lux-nav-link shopora-nav-item hidden xl:block">
            Health Tools
          </button>

          <button type="button" onClick={() => navigate("/tracker")} className="lux-nav-link shopora-nav-item hidden xl:block">
            Tracker
          </button>

          <PremiumMoreMenu />
        </nav>

        <div className="shopora-header-actions flex items-center justify-end gap-1.5">
          <CommandPalette transparent={false} />

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
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                  {cartCount}
                </span>
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

                {effectiveMenuOpen && (
                  <>
                    <button
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setOpen(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
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
                        {isAdmin && (
                          <button
                            onClick={() => {
                              navigate("/admin/dashboard");
                              setOpen(false);
                            }}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                          >
                            Admin dashboard
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
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="ml-1 flex items-center gap-2">
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--lux-muted)] hover:text-[var(--lux-ink)] sm:block"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="rounded-xl bg-[var(--lux-ink)] px-4 py-2.5 text-xs font-semibold text-[var(--lux-bg)] transition hover:opacity-85 sm:text-sm"
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

      {mobileMenuOpen && (
        <nav className="border-t border-[var(--lux-line)] bg-[var(--lux-surface)] px-4 py-4 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            <button type="button" onClick={() => goMobile("/shop")} className="lux-mobile-nav-link">Shop</button>
            <button type="button" onClick={() => goMobile("/home#plans")} className="lux-mobile-nav-link">Fitness Plans</button>
            <button type="button" onClick={() => goMobile("/home#health-tools")} className="lux-mobile-nav-link">Health Tools</button>
            <button type="button" onClick={() => goMobile("/tracker")} className="lux-mobile-nav-link">Tracker</button>
            <button type="button" onClick={() => goMobile("/plans/weight-loss")} className="lux-mobile-nav-link">Weight Loss</button>
            <button type="button" onClick={() => goMobile("/plans/muscle-building")} className="lux-mobile-nav-link">Muscle Building</button>
            <button type="button" onClick={() => goMobile("/plans/mobility-recovery")} className="lux-mobile-nav-link">Mobility & Recovery</button>
            <button type="button" onClick={() => goMobile("/home#membership")} className="lux-mobile-nav-link">Membership</button>
            {user && <button type="button" onClick={() => goMobile("/profile")} className="lux-mobile-nav-link">Profile, rewards & orders</button>}
            {isAdmin && <button type="button" onClick={() => goMobile("/admin/dashboard")} className="lux-mobile-nav-link">Admin dashboard</button>}
          </div>
        </nav>
      )}
    </header>
  );
}
