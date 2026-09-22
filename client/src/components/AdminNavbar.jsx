// src/components/AdminNavbar.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { API_URL } from "../config/app";
import ThemeToggle from "./ThemeToggle";
import { BrandMark } from "./BrandLogo";

export default function AdminNavbar({ range, setRange, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleSignOut = async () => {
    await fetch(`${API_URL}/api/admin/logout`, {
      method: "POST",
      credentials: "include",
    });
    setMenuOpen?.(false);
    navigate("/admin/login", { replace: true });
  };

  const ranges = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[#0a0b0d] text-white shadow-lg shadow-black/10">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-5 lg:px-10">
        <button
          type="button"
          className="flex shrink-0 cursor-pointer items-center gap-2 sm:gap-4"
          onClick={() => navigate("/admin/dashboard")}
        >
          <BrandMark size={36} />
          <span className="font-heading text-lg font-extrabold tracking-tight text-white sm:text-xl">
            Shopora
          </span>
          <div className="hidden h-4 w-px bg-white/20 sm:block" />
          <p className="hidden text-xs uppercase tracking-[0.2em] text-white/45 sm:block">
            Admin
          </p>
          <span className="rounded-lg border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-white/45 sm:hidden">
            Admin
          </span>
        </button>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {setRange && range !== undefined ? (
            <div className="scrollbar-none flex items-center gap-1 overflow-x-auto sm:gap-2">
              {ranges.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={`min-h-8.5 shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs transition-all sm:px-4 sm:py-2 ${
                    range === key
                      ? "bg-white text-black"
                      : "border border-white/15 text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="min-h-9 shrink-0 cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65 transition-all hover:bg-white/10 hover:text-white sm:px-5"
            >
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
          )}

          <ThemeToggle />

          {!authLoading && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen?.((p) => !p)}
                className="ml-0.5 flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-2 py-1.5 transition-colors hover:bg-white/10 sm:ml-1 sm:px-2.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Admin profile picture"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {(user?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen?.(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:w-56">
                    <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                      <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
                        {user?.displayName || "Account"}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <a
                        href="https://www.linkedin.com/in/raj-basant/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10"
                      >
                        Basant Raj - LinkedIn
                      </a>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="min-h-9 w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="border-t border-white/10 bg-[#0f1115]">
        <div className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-5 lg:px-10">
          {[
            ["Overview", "/admin/dashboard"],
            ["Inventory", "/admin/inventory"],
            ["Customers", "/admin/customers"],
            ["Reports", "/admin/reports"],
            ["Marketing", "/admin/marketing"],
            ["Bugs", "/admin/bugs"],
          ].map(([label, route]) => (
            <button key={route} type="button" onClick={() => navigate(route)} className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold text-white/55 transition hover:bg-white/10 hover:text-white">
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
