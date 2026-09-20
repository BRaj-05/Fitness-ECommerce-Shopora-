import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const date = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const statusClass = {
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  created: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  failed: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
};

function Avatar({ order }) {
  if (order.customerPhoto) {
    return (
      <img
        src={order.customerPhoto}
        alt={order.customerName || "Customer"}
        className="h-9 w-9 rounded-xl object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
      {(order.customerName?.[0] || order.customerEmail?.[0] || "U").toUpperCase()}
    </div>
  );
}

export default function AdminRecentOrders({ orders = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;

    return orders.filter((order) =>
      [order._id, order.paymentId, order.customerName, order.customerEmail, order.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [orders, query]);

  const openInvoice = (order) => {
    navigate(`/invoice/payment/${order._id}`, {
      state: {
        order,
        customer: {
          name: order.customerName,
          email: order.customerEmail,
          photoURL: order.customerPhoto,
        },
        fromAdmin: true,
      },
    });
  };

  return (
    <section className="lux-admin-table">
      <div className="flex flex-col gap-4 border-b border-[var(--lux-line)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Live commerce</p>
          <h2 className="font-heading mt-1 text-xl font-extrabold text-slate-950 dark:text-white">Recent transactions</h2>
        </div>

        <label className="relative block sm:w-72">
          <span className="sr-only">Search transactions</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, customer, payment..."
            className="shopora-focus h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />
        </label>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px]">
          <thead className="sticky top-0 z-10">
            <tr>
              {["Order", "Customer", "Items", "Amount", "Status", "Date", ""].map((heading) => (
                <th key={heading || "action"} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((order) => (
              <tr key={order._id} className="transition hover:bg-indigo-50/45 dark:hover:bg-indigo-500/5">
                <td className="px-5 py-4">
                  <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">#{order._id?.slice(-8).toUpperCase()}</div>
                  <div className="mt-1 max-w-32 truncate font-mono text-[9px] text-slate-400">{order.paymentId || "No payment id"}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar order={order} />
                    <div className="min-w-0">
                      <p className="max-w-40 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{order.customerName || "Customer"}</p>
                      <p className="mt-0.5 max-w-44 truncate text-[10px] text-slate-400">{order.customerEmail || "-"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{order.items?.length || 0}</td>
                <td className="px-5 py-4 font-heading text-sm font-extrabold text-slate-950 dark:text-white">{money(order.total)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusClass[order.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{date(order.createdAt)}</td>
                <td className="px-5 py-4 text-right">
                  <button type="button" onClick={() => openInvoice(order)} className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10">
                    Invoice
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No matching transactions.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
        {filtered.map((order) => (
          <button type="button" onClick={() => openInvoice(order)} key={order._id} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar order={order} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-white">{order.customerName || "Customer"}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">#{order._id?.slice(-6).toUpperCase()} &middot; {date(order.createdAt)}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-heading text-sm font-extrabold text-slate-950 dark:text-white">{money(order.total)}</p>
              <p className="mt-1 text-[9px] font-bold uppercase text-emerald-600">{order.status}</p>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-400">No matching transactions.</p>}
      </div>
    </section>
  );
}
