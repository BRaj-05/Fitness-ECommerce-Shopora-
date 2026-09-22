import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CreatorCredit from "../components/CreatorCredit";
import ProductImage from "../components/ProductImage";
import { auth } from "../auth/firebase";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import {
  API_URL,
  APP_NAME,
  OWNER_LINKEDIN,
  OWNER_NAME,
  SUPPORT_EMAIL,
} from "../config/app";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value ? new Date(value) : new Date());

function InvoiceSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-40 rounded-3xl bg-slate-100 dark:bg-slate-800" />
      <div className="mt-5 h-96 rounded-3xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export default function PaymentInvoice() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passed = location.state || {};

  const [order, setOrder] = useState(passed.order || null);
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!passed.order);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `Invoice | ${APP_NAME}`;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        if (!passed.order) setError("Sign in to load this invoice.");
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const jobs = [
          fetch(`${API_URL}/api/user/profile/${user.uid}`, {
            headers,
            credentials: "include",
          }),
          fetch(`${API_URL}/api/products?all=true`, {
            credentials: "include",
          }),
        ];

        if (!order) {
          jobs.push(
            fetch(`${API_URL}/api/orders/${user.uid}`, {
              headers,
              credentials: "include",
            }),
          );
        }

        const responses = await Promise.all(jobs);
        const profileResponse = responses[0];
        const productResponse = responses[1];

        if (profileResponse.ok) {
          const data = await profileResponse.json();
          if (active) setProfile(data);
        }

        if (productResponse.ok) {
          const data = await productResponse.json();
          const list = Array.isArray(data) ? data : data?.products || data?.data || [];
          if (active) setProducts(list);
        }

        if (!order) {
          const orderResponse = responses[2];
          if (!orderResponse.ok) throw new Error("Unable to load order history for this invoice.");
          const list = await orderResponse.json();
          const found = Array.isArray(list)
            ? list.find((entry) => String(entry._id) === String(orderId))
            : null;
          if (!found) throw new Error("Invoice order was not found for this account.");
          if (active) setOrder(found);
        }
      } catch (loadError) {
        console.error("Invoice load error:", loadError);
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [orderId]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [Number(product.productId || product.id), product])),
    [products],
  );

  const invoiceItems = useMemo(() => {
    if (passed.items?.length) {
      return passed.items.map(({ product, quantity }) => ({
        productId: product.productId || product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        quantity,
        price: Number(product.price || 0),
      }));
    }

    if (!order?.items?.length) return [];

    return order.items.map((item) => {
      const product = productMap.get(Number(item.productId));
      return {
        productId: item.productId,
        name: product?.name || `Product #${item.productId}`,
        brand: product?.brand || "Shopora",
        image: product?.image || "",
        quantity: item.quantity,
        price: Number(item.price || 0),
      };
    });
  }, [order, passed.items, productMap]);

  const billedName =
    passed.customer?.name || profile?.name || auth.currentUser?.displayName || "Shopora Customer";

  const billedEmail =
    passed.customer?.email || profile?.email || auth.currentUser?.email || "";

  const address =
    passed.address ||
    profile?.addresses?.find((item) => item.id === profile.defaultAddressId) ||
    profile?.addresses?.[0] ||
    null;

  const lineSubtotal = invoiceItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const subtotal = Number(passed.subtotal ?? order?.subtotal ?? lineSubtotal);
  const total = Number(passed.total ?? order?.total ?? subtotal);
  const discountAmount = Number(
    passed.discountAmt ?? order?.discountAmount ?? Math.max(0, subtotal - total),
  );

  const invoiceNumber = `SHO-${String(order?._id || orderId || "PAYMENT")
    .slice(-10)
    .toUpperCase()}`;

  const paymentId = order?.paymentId || passed.paymentId || "-";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar variant="home" />
        <InvoiceSkeleton />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar variant="home" />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-rose-200 bg-white p-8 shadow-sm dark:border-rose-500/20 dark:bg-slate-900">
            <p className="font-heading text-2xl font-extrabold text-slate-950 dark:text-white">Invoice unavailable</p>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{error}</p>
            <button type="button" onClick={() => navigate("/profile")} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
              Go to profile
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="shopora-invoice-page min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar variant="home" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="invoice-no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">Payment record</p>
            <h1 className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Invoice</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Back</button>
            <button type="button" onClick={() => window.print()} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700">Print / Save PDF</button>
          </div>
        </div>

        <article className="shopora-invoice-sheet overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900">
          <header className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-6 py-8 text-white dark:border-slate-800 sm:px-9 sm:py-10">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-extrabold text-indigo-700">S</span>
                  <div>
                    <p className="font-heading text-xl font-extrabold">Shopora</p>
                    <p className="text-xs text-indigo-100/65">Train better. Shop smarter.</p>
                  </div>
                </div>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200/60">Invoice number</p>
                <p className="mt-1 font-mono text-sm font-semibold text-white">{invoiceNumber}</p>
              </div>

              <div className="sm:text-right">
                <span className="inline-flex rounded-xl bg-emerald-400/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-emerald-300/20">Paid</span>
                <p className="mt-4 text-xs text-indigo-100/60">Issued</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(order?.createdAt)}</p>
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-9">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Issued by</p>
                <p className="mt-3 font-heading text-lg font-extrabold text-slate-950 dark:text-white">Shopora</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Project owner: {OWNER_NAME}</p>
                <a href={OWNER_LINKEDIN} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">LinkedIn</a>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Billed to</p>
                <p className="mt-3 font-heading text-lg font-extrabold text-slate-950 dark:text-white">{billedName}</p>
                {billedEmail && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{billedEmail}</p>}
                {address && (
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {[address.line1, address.line2, address.city, address.state, address.zip, address.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Order summary</p>
                  <h2 className="font-heading mt-1 text-xl font-extrabold text-slate-950 dark:text-white">Purchased items</h2>
                </div>
                <p className="text-xs text-slate-400">{invoiceItems.length} item{invoiceItems.length === 1 ? "" : "s"}</p>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="hidden grid-cols-[1fr_90px_120px_130px] bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-950/70 sm:grid">
                  <span>Product</span><span>Qty</span><span>Rate</span><span className="text-right">Amount</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoiceItems.map((item) => (
                    <div key={`${item.productId}-${item.name}`} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_90px_120px_130px] sm:items-center sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductImage product={item} className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{item.brand}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400"><span className="sm:hidden">Qty - </span>{item.quantity}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400"><span className="sm:hidden">Rate - </span>{money(item.price)}</p>
                      <p className="font-heading text-sm font-extrabold text-slate-950 dark:text-white sm:text-right">{money(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Payment method</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">R</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Razorpay</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{paymentId}</p>
                  </div>
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-400">Payment status was verified by the Shopora backend before this order was marked paid.</p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-5 text-white dark:bg-black">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-300"><span>Discount</span><span>-{money(discountAmount)}</span></div>
                  )}
                  <div className="h-px bg-white/10" />
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-300">Total paid</span>
                    <span className="font-heading text-2xl font-extrabold">{money(total)}</span>
                  </div>
                </div>
              </div>
            </section>

            <footer className="mt-9 flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Thank you for shopping with Shopora.</p>
                <p className="mt-1 text-xs text-slate-400">
                  {SUPPORT_EMAIL
                    ? `Need help? ${SUPPORT_EMAIL}`
                    : "Need help? Use the project owner links below."}
                </p>
              </div>
              <CreatorCredit compact />
            </footer>
          </div>
        </article>
      </main>
    </div>
  );
}
