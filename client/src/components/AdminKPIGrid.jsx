import { AlertTriangle, Boxes, CircleOff, Package, ShoppingBag, TrendingUp, Users, WalletCards } from "lucide-react";
import AdminStatCard from "./AdminStatCard";

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
    icon: TrendingUp,
  },
  {
    key: "totalOrders",
    label: "Orders",
    format: (value) => Number(value || 0).toLocaleString("en-IN"),
    hint: "Completed transactions",
    accent: "bg-[var(--lux-violet)]",
    icon: ShoppingBag,
  },
  {
    key: "totalCustomers",
    label: "Customers",
    format: (value) => Number(value || 0).toLocaleString("en-IN"),
    hint: "Unique paying users",
    accent: "bg-[var(--lux-mint)]",
    icon: Users,
  },
  {
    key: "averageOrderValue",
    label: "Average order value",
    format: money,
    hint: "Revenue per paid order",
    accent: "bg-amber-500",
    icon: WalletCards,
  },
  { key: "lowStockCount", label: "Low stock", format: (value) => Number(value || 0).toLocaleString("en-IN"), hint: "Needs inventory attention", accent: "bg-amber-500", icon: AlertTriangle },
  { key: "outOfStockCount", label: "Out of stock", format: (value) => Number(value || 0).toLocaleString("en-IN"), hint: "Unavailable products", accent: "bg-rose-500", icon: CircleOff },
  { key: "reservedUnits", label: "Reserved units", format: (value) => Number(value || 0).toLocaleString("en-IN"), hint: "Held in active carts", accent: "bg-[var(--lux-mint)]", icon: Boxes },
  { key: "totalProducts", label: "Products", format: (value) => Number(value || 0).toLocaleString("en-IN"), hint: "Catalog size", accent: "bg-[var(--lux-muted)]", icon: Package },
];

export default function AdminKPIGrid({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
      {cards.map((card, index) => <AdminStatCard key={card.key} {...card} value={stats[card.key]} index={index} />)}
    </div>
  );
}
