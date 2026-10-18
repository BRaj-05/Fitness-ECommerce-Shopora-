import { createElement, useEffect, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bug, ChartNoAxesCombined, LayoutDashboard, LogOut, Megaphone, Package, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { API_URL } from "../config/app";
import ThemeToggle from "./ThemeToggle";
import { BrandMark } from "./BrandLogo";

const NAV_ITEMS = [
  ["Overview", "/admin/dashboard", LayoutDashboard],
  ["Inventory", "/admin/inventory", Package],
  ["Customers", "/admin/customers", Users],
  ["Reports", "/admin/reports", ChartNoAxesCombined],
  ["Marketing", "/admin/marketing", Megaphone],
  ["Bugs", "/admin/bugs", Bug],
];

const RANGES = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export default function AdminNavbar({ range, setRange, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [localMenuOpen, setLocalMenuOpen] = useState(false);
  const accountOpen = typeof setMenuOpen === "function" ? Boolean(menuOpen) : localMenuOpen;
  const setAccountOpen = (value) => {
    if (typeof setMenuOpen === "function") setMenuOpen(value);
    else setLocalMenuOpen(value);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/admin/session`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setAdminEmail(data.authenticated ? data.email || "" : ""))
      .catch(() => {});
  }, []);

  const go = (route) => {
    setAccountOpen(false);
    navigate(route);
  };

  const handleSignOut = async () => {
    await fetch(`${API_URL}/api/admin/logout`, { method: "POST", credentials: "include" });
    setAccountOpen(false);
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="admin-nav-shell" aria-label="Admin navigation">
      <div className="admin-nav-brand">
        <button type="button" onClick={() => go("/admin/dashboard")} className="flex items-center gap-3 text-left">
          <BrandMark size={36} />
          <span>
            <strong className="font-heading block text-lg font-extrabold text-white">Shopora</strong>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Admin operations</span>
          </span>
        </button>
        <span className="admin-nav-secure"><ShieldCheck size={14} />Secure</span>
      </div>

      <nav className="admin-nav-links">
        {NAV_ITEMS.map(([label, route, Icon]) => {
          const active = location.pathname === route || location.pathname.startsWith(`${route}/`);
          return (
            <button key={route} type="button" onClick={() => go(route)} aria-current={active ? "page" : undefined} className="admin-nav-link">
              {active && <Motion.span layoutId="admin-active-nav" className="admin-nav-active" transition={{ duration: reduceMotion ? 0 : 0.2 }} />}
              <span className="relative z-10">{createElement(Icon, { size: 17, strokeWidth: 1.8 })}</span>
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>

      {setRange && range !== undefined && (
        <div className="admin-range-block">
          <p className="admin-nav-label">Reporting range</p>
          <div className="admin-range-control">
            {RANGES.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setRange(key)} aria-pressed={range === key} className={range === key ? "is-active" : ""}>
                {range === key && <Motion.span layoutId="admin-range-pill" className="admin-range-pill" transition={{ duration: reduceMotion ? 0 : 0.18 }} />}
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="admin-nav-footer">
        <ThemeToggle />
        <div className="relative min-w-0 flex-1">
          <button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} className="admin-account-trigger">
            <span className="admin-account-avatar">{(adminEmail?.[0] || user?.email?.[0] || "A").toUpperCase()}</span>
            <span className="min-w-0 text-left">
              <strong className="block truncate text-xs text-white">Administrator</strong>
              <span className="block truncate text-[10px] text-white/40">{adminEmail || "Secure session"}</span>
            </span>
          </button>

          <AnimatePresence>
            {accountOpen && (
              <>
                <button type="button" className="fixed inset-0 z-40 cursor-default" onClick={() => setAccountOpen(false)} aria-label="Close account menu" />
                <Motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 5 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16 }}
                  className="admin-account-menu"
                >
                  <div className="border-b border-[var(--lux-line)] px-4 py-3">
                    <p className="truncate text-xs font-bold text-[var(--lux-ink)]">{adminEmail || "Shopora Admin"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--lux-muted)]"><ShieldCheck size={12} />Environment session</p>
                  </div>
                  <button type="button" onClick={handleSignOut} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <LogOut size={14} />Sign out
                  </button>
                </Motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
