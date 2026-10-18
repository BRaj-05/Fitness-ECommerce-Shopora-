// src/pages/AdminReports.jsx
import { useState, useEffect } from "react";
import { fmt } from "../utils/formatters";
import AdminNavbar from "../components/AdminNavbar";
import AdminEmptyState from "../components/AdminEmptyState";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminStatCard from "../components/AdminStatCard";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { AlertTriangle, FolderOpen, ShoppingBag, TrendingUp, WalletCards } from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const RANGE_LABELS = {
  daily: "Last 24 Hours",
  weekly: "Last 7 Days",
  monthly: "Last 30 Days",
};

const SkeletonRow = ({ cols = 3 }) => (
  <tr className="border-b border-stone-100">
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="px-4 sm:px-6 py-4 sm:py-5">
        <div
          className="h-3 bg-stone-100 rounded-full animate-pulse"
          style={{ width: `${[55, 20, 25][i] ?? 30}%`, margin: i > 0 ? "0 auto" : "0" }}
        />
      </td>
    ))}
  </tr>
);

const Empty = ({ message = "No data for this period", hint = "Try switching to a wider range" }) => (
  <tr>
    <td colSpan={3}>
      <AdminEmptyState icon={FolderOpen} title={message} hint={hint} />
    </td>
  </tr>
);

// Mobile revenue row
const RevenueMobileCard = ({ row }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-stone-100 last:border-0">
    <div>
      <p className="text-sm text-stone-700 font-medium">{row.date}</p>
    </div>
    <div className="flex items-center gap-4">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full
                       bg-stone-100 text-stone-600 text-xs font-medium">
        {row.orderCount}
      </span>
      <span style={{ fontFamily: "Manrope, Inter, sans-serif" }} className="text-lg text-stone-900">
        {fmt(row.totalRevenue)}
      </span>
    </div>
  </div>
);

// Mobile product row
const ProductMobileCard = ({ p, index, productMap }) => {
  const prod = productMap?.[p.productId] || {};
  const name = prod.name || `Product #${p.productId}`;
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-stone-100 last:border-0">
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                      font-medium shrink-0
                      ${index === 0 ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-400"}`}>
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-700 font-medium truncate">{name}</p>
        <p className="text-xs text-stone-400 mt-0.5">{p.totalQuantitySold} units sold</p>
      </div>
      <span style={{ fontFamily: "Manrope, Inter, sans-serif" }} className="text-lg text-stone-900 shrink-0">
        {fmt(p.totalRevenue)}
      </span>
    </div>
  );
};

export default function AdminReports() {
  const [range, setRange] = useState("weekly");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/reports/sales?range=${range}`, { headers, credentials: "include" });
        if (!res.ok) throw new Error("Failed to load report data");
        const json = await res.json();
        setData(json);
        setLoading(false);
      } catch {
        setError("Failed to load report data");
        setLoading(false);
      }
    })();
  }, [range]);

  const { summary, revenueByDate, productPerformance } = data || {};
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    if (!productPerformance || productPerformance.length === 0) return;
    const ids = [...new Set(productPerformance.map(p => p.productId).filter(Boolean))];
    if (ids.length === 0) return;
    const map = {};
    Promise.all(ids.map(id =>
      fetch(`${API_BASE}/products/${id}`).then(r => r.ok ? r.json() : null)
        .then(p => { if (p) map[id] = p; })
        .catch(() => { })
    )).then(() => setProductMap(map));
  }, [productPerformance]);

  return (
    <div className="admin-lux-page" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <AdminNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="admin-page-content max-w-5xl mx-auto px-4 sm:px-5 lg:px-10 py-8 sm:py-12">

        <AdminPageHeader
          eyebrow={RANGE_LABELS[range]}
          title="Sales reports"
          description="Review paid-order revenue, volume and product performance for the selected period."
          action={(
            <div className="flex gap-2" role="group" aria-label="Report range">
              {Object.entries(RANGE_LABELS).map(([key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  aria-pressed={range === key}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${range === key ? "bg-[var(--lux-ink)] text-[var(--lux-bg)]" : "border border-[var(--lux-line)] text-[var(--lux-muted)] hover:bg-[var(--lux-soft)]"}`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          )}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 mb-6 sm:mb-8">
            <p className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle size={16} />{error}</p>
            <p className="text-xs text-red-400 mt-1">Please try refreshing the page</p>
          </div>
        )}

        {/* KPI cards */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-3 sm:gap-4 md:gap-5">
          {loading ? [...Array(3)].map((_, index) => <div key={index} className="lux-admin-card h-32 animate-pulse bg-[var(--lux-soft)]" />) : [
            { label: "Total revenue", value: summary?.totalRevenue || 0, format: fmt, icon: TrendingUp, accent: "bg-[var(--lux-orange)]", hint: "Paid revenue in range" },
            { label: "Total orders", value: summary?.totalOrders || 0, icon: ShoppingBag, accent: "bg-[var(--lux-violet)]", hint: "Paid orders in range" },
            { label: "Average order value", value: summary?.avgOrderValue || 0, format: fmt, icon: WalletCards, accent: "bg-[var(--lux-mint)]", hint: "Revenue per order" },
          ].map((card, index) => <AdminStatCard key={card.label} {...card} index={index} />)}
        </div>

        {/* Revenue by Date */}
        <div className="mb-6 sm:mb-8">
          <div className="lux-admin-table">
            <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-stone-100
                            flex justify-between items-center">
              <div>
                <p className="lux-eyebrow mb-0.5">Breakdown</p>
                <h2 className="font-heading text-xl font-extrabold text-[var(--lux-ink)]">
                  Revenue by Date
                </h2>
              </div>
              {!loading && revenueByDate && (
                <p className="text-xs text-stone-400">{revenueByDate.length} entries</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden px-4 py-2">
              {loading && (
                <div className="space-y-3 py-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-stone-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
              {!loading && revenueByDate?.length === 0 && (
                <AdminEmptyState icon={FolderOpen} title="No data for this period" hint="Try switching to a wider range." />
              )}
              {!loading && revenueByDate?.map(row => (
                <RevenueMobileCard key={row.date} row={row} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["Date", "Orders", "Revenue"].map((h, i) => (
                      <th key={h}
                        className={`px-6 py-4 text-xs tracking-[0.15em] uppercase
                                    text-stone-400 font-normal
                                    ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                  {!loading && revenueByDate?.length === 0 && <Empty />}
                  {!loading && revenueByDate?.map(row => (
                    <tr key={row.date} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-5 text-stone-700 font-medium">{row.date}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7
                                         rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
                          {row.orderCount}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span style={{ fontFamily: "Manrope, Inter, sans-serif" }} className="text-lg text-stone-900">
                          {fmt(row.totalRevenue)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div>
          <div className="lux-admin-table">
            <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-stone-100
                            flex justify-between items-center">
              <div>
                <p className="lux-eyebrow mb-0.5">Ranking</p>
                <h2 className="font-heading text-xl font-extrabold text-[var(--lux-ink)]">
                  Product Performance
                </h2>
              </div>
              {!loading && productPerformance && (
                <p className="text-xs text-stone-400">{productPerformance.length} products</p>
              )}
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden px-4 py-2">
              {loading && (
                <div className="space-y-3 py-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-stone-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
              {!loading && productPerformance?.length === 0 && (
                <AdminEmptyState icon={FolderOpen} title="No product data for this period" hint="Try switching to a wider range." />
              )}
              {!loading && productPerformance?.map((p, index) => (
                <ProductMobileCard key={p.productId} p={p} index={index} productMap={productMap} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["Product", "Units Sold", "Revenue"].map((h, i) => (
                      <th key={h}
                        className={`px-6 py-4 text-xs tracking-[0.15em] uppercase
                                    text-stone-400 font-normal
                                    ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                  {!loading && productPerformance?.length === 0 && (
                    <Empty message="No product data for this period" />
                  )}
                  {!loading && productPerformance?.map((p, index) => {
                    const prod = productMap?.[p.productId] || {};
                    const name = prod.name || `Product #${p.productId}`;
                    return (
                      <tr key={p.productId} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center
                                              text-xs font-medium shrink-0
                                              ${index === 0 ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-400"}`}>
                              {index + 1}
                            </span>
                            <span className="text-stone-700 font-medium">{name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span style={{ fontFamily: "Manrope, Inter, sans-serif" }} className="text-lg text-stone-700">
                            {p.totalQuantitySold}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span style={{ fontFamily: "Manrope, Inter, sans-serif" }} className="text-lg text-stone-900">
                            {fmt(p.totalRevenue)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-10 border-t border-[var(--lux-line)] bg-[var(--lux-surface)] sm:mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 lg:px-10 py-5 sm:py-6
                        flex justify-between items-center">
          <span className="font-heading font-extrabold text-[var(--lux-ink)]">Shopora</span>
          <p className="text-xs text-[var(--lux-muted)]">Sales Reports &middot; &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
