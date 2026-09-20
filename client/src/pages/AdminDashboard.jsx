// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import AdminKPIGrid from "../components/AdminKPIGrid";
import AdminRecentOrders from "../components/AdminRecentOrders";
import CreatorCredit from "../components/CreatorCredit";
import AdminAccessCard from "../components/AdminAccessCard";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium text-slate-900 dark:text-white">
          {p.name === "revenue" ? fmt(p.value) : `${p.value} units`}
        </p>
      ))}
    </div>
  );
};

const SectionCard = ({ title, eyebrow, children }) => (
  <div className="lux-admin-card p-5 transition-all duration-300 sm:p-7">
    {eyebrow && (
      <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
    )}
    <h2 className="font-heading mb-5 text-xl font-extrabold text-slate-950 dark:text-white sm:mb-6">
      {title}
    </h2>
    {children}
  </div>
);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 ${className}`} />
);

const Empty = () => (
  <div className="flex flex-col items-center justify-center py-10 text-center sm:py-12">
    <p className="mb-3 text-3xl text-slate-300">-</p>
    <p className="text-sm text-slate-400">No data for this period</p>
  </div>
);

export default function AdminDashboard() {
  const [range, setRange] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/dashboard?range=${range}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [range, refreshTick]);

  return (
    <div className="min-h-screen bg-[var(--lux-bg)] text-[var(--lux-ink)]">
      <AdminNavbar range={range} setRange={setRange} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <style>{`
        .shopora-chart .recharts-cartesian-grid-horizontal line,
        .shopora-chart .recharts-cartesian-grid-vertical line { stroke: #e2e8f0; }
        .shopora-chart .recharts-tooltip-cursor { fill: #f8fafc; }
        .fade-in { animation: fmFadeIn 0.5s ease forwards; }
        @keyframes fmFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12 lg:px-10">
        <section className="lux-admin-hero mb-7">
          <div>
            <p className="lux-eyebrow text-white/45">SHOPORA OPERATIONS</p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-0.035em] text-white">
              Commerce overview
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Orders, inventory, customers and payment activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="shopora-live-dot h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-white/70">Live</span>
          </div>
        </section>

        <AdminAccessCard />

        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-10 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
          {[
            ["/admin/inventory", "Inventory", "Manage products, stock levels and pricing."],
            ["/admin/customers", "Customers", "View customer profiles and order history."],
            ["/admin/reports", "Reports", "Track revenue and performance metrics."],
            ["/admin/marketing", "Marketing", "Manage campaigns and promotions."],
            ["/admin/bugs", "Bug Reports", "Triage reports submitted by users."],
          ].map(([href, title, desc]) => (
            <button
              key={href}
              type="button"
              onClick={() => { window.location.href = href; }}
              className="lux-admin-card shopora-lift p-5 text-left"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-sm font-extrabold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                {title[0]}
              </span>
              <h3 className="font-heading mt-4 text-lg font-extrabold text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 sm:mb-8 sm:px-6 sm:py-5">
            <p className="text-sm text-red-600">{error} - make sure the backend server is running.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 sm:h-36" />)}
            </div>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <Skeleton className="h-60 sm:h-72" />
              <Skeleton className="h-60 sm:h-72" />
            </div>
            <Skeleton className="h-72 sm:h-80" />
          </div>
        )}

        {!loading && data && (
          <div className="fade-in space-y-4 sm:space-y-5">
            <AdminKPIGrid stats={data.kpis} />

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
              <SectionCard eyebrow="Analytics" title="Revenue Over Time">
                {data.revenueOverTime.length === 0 ? <Empty /> : (
                  <div className="shopora-chart">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={data.revenueOverTime} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" name="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard eyebrow="Performance" title="Top 5 Selling Products">
                {data.topProducts.length === 0 ? <Empty /> : (
                  <div className="shopora-chart">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="totalQuantity" name="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>

            <AdminRecentOrders orders={data.recentOrders} />
          </div>
        )}
      </div>

      <footer className="mt-10 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <CreatorCredit />
          <p className="text-xs text-slate-400">Shopora Admin &middot; © 2026</p>
        </div>
      </footer>
    </div>
  );
}
