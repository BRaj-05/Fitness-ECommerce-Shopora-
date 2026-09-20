const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const cards = [
  {
    key: "totalRevenue",
    label: "Revenue",
    format: money,
    hint: "Paid orders in range",
    accent: "bg-[var(--lux-orange)]",
    iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    icon: "Rs",
  },
  {
    key: "totalOrders",
    label: "Orders",
    format: (value) => Number(value || 0).toLocaleString("en-IN"),
    hint: "Completed transactions",
    accent: "bg-[var(--lux-violet)]",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    icon: "Up",
  },
  {
    key: "totalCustomers",
    label: "Customers",
    format: (value) => Number(value || 0).toLocaleString("en-IN"),
    hint: "Unique paying users",
    accent: "bg-[var(--lux-mint)]",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    icon: "C",
  },
  {
    key: "lowStockCount",
    label: "Low stock",
    format: (value) => Number(value || 0).toLocaleString("en-IN"),
    hint: "Needs inventory attention",
    accent: "bg-amber-500",
    iconTone: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
    icon: "!",
  },
];

export default function AdminKPIGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="lux-admin-card shopora-lift relative overflow-hidden p-4 sm:p-5"
        >
          <span className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {card.label}
              </p>
              <p className="font-heading mt-3 truncate text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {card.format(stats[card.key])}
              </p>
              <p className="mt-2 hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                {card.hint}
              </p>
            </div>
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-extrabold ${card.iconTone}`}>
              {card.icon}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
