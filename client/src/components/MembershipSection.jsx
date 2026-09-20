import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthHeaders } from "../utils/getAuthHeaders";
import { API_URL } from "../config/app";
import MembershipVisualPanel from "./MembershipVisualPanel";

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    priceLabel: "Free",
    duration: "No expiry",
    accent: "from-slate-500 to-slate-700",
    benefits: [
      "Shopora store access",
      "BMI, TDEE & calorie tools",
      "Structured fitness plans",
      "1x Shopora Rewards",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "Rs. 499",
    duration: "30 days",
    accent: "from-indigo-600 to-blue-500",
    benefits: [
      "Everything in Starter",
      "1.25x Shopora Rewards",
      "Pro membership status",
      "Extend anytime for another 30 days",
    ],
  },
  {
    key: "elite",
    name: "Elite",
    priceLabel: "Rs. 1,499",
    duration: "30 days",
    accent: "from-emerald-500 to-teal-500",
    benefits: [
      "Everything in Starter",
      "1.5x Shopora Rewards",
      "Elite membership status",
      "Extend anytime for another 30 days",
    ],
  },
];

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatExpiry(value) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function MembershipSection({ user }) {
  const [membership, setMembership] = useState({
    tier: "starter",
    name: "Starter",
    status: "active",
    active: true,
    expiresAt: null,
    rewardMultiplier: 1,
  });
  const [loading, setLoading] = useState(true);
  const [payingTier, setPayingTier] = useState(null);
  const [message, setMessage] = useState(null);

  const currentTierIndex = useMemo(
    () => PLANS.findIndex((plan) => plan.key === membership.tier),
    [membership.tier],
  );

  const refreshMembership = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_URL}/api/membership/status/${user.uid}`,
        {
          headers,
          credentials: "include",
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Could not load membership");
      }

      const data = await response.json();
      setMembership(data);
    } catch (error) {
      console.error("Membership status error:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    refreshMembership();
  }, [refreshMembership]);

  const verifyMembershipPayment = async (tier, response) => {
    const headers = await getAuthHeaders();

    const verifyResponse = await fetch(
      `${API_URL}/api/membership/verify-payment`,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          userId: user.uid,
          tier,
          ...response,
        }),
      },
    );

    const payload = await verifyResponse.json().catch(() => ({}));

    if (!verifyResponse.ok) {
      throw new Error(
        payload.error || "Membership payment verification failed",
      );
    }

    setMembership(payload.membership);
    setMessage({
      type: "success",
      text: `${payload.membership.name} membership is now active.`,
    });
  };

  const purchaseMembership = async (tier) => {
    if (!user?.uid) return;

    setMessage(null);
    setPayingTier(tier);

    try {
      const sdkLoaded = await loadRazorpayScript();

      if (!sdkLoaded) {
        throw new Error("Unable to load Razorpay checkout");
      }

      if (!RAZORPAY_KEY) {
        throw new Error(
          "Razorpay public key is not configured in client/.env",
        );
      }

      const headers = await getAuthHeaders();

      const orderResponse = await fetch(
        `${API_URL}/api/membership/create-order`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            userId: user.uid,
            tier,
          }),
        },
      );

      const order = await orderResponse.json().catch(() => ({}));

      if (!orderResponse.ok) {
        throw new Error(
          order.error || "Unable to create membership order",
        );
      }

      const selectedPlan = PLANS.find((plan) => plan.key === tier);

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Shopora",
        description: `${order.planName} membership - ${order.durationDays} days`,
        order_id: order.id,
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        handler: async (response) => {
          try {
            await verifyMembershipPayment(tier, response);
          } catch (error) {
            setMessage({
              type: "error",
              text: error.message,
            });
          } finally {
            setPayingTier(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingTier(null);
          },
        },
        notes: {
          membership: selectedPlan?.name || tier,
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setPayingTier(null);
        setMessage({
          type: "error",
          text:
            response.error?.description ||
            "Membership payment failed. Please try again.",
        });
      });

      razorpay.open();
    } catch (error) {
      setPayingTier(null);
      setMessage({
        type: "error",
        text: error.message,
      });
    }
  };

  const demoMembership = async (tier) => {
    if (import.meta.env.PROD || !user?.uid) return;

    setMessage(null);
    setPayingTier(tier);

    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/membership/demo-success`,
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            userId: user.uid,
            tier,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error || "Unable to activate demo membership",
        );
      }

      setMembership(payload.membership);
      setMessage({
        type: "success",
        text: `Demo ${payload.membership.name} membership activated.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setPayingTier(null);
    }
  };

  return (
    <section id="membership" className="scroll-mt-24">
      <div className="membership-editorial-grid">
        <MembershipVisualPanel currentTier={membership?.tier || "starter"} />
        <div className="membership-plan-side">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            Shopora Membership
          </p>
          <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Make every purchase count more.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Paid memberships last 30 days and can be manually renewed.
            They increase the Shopora Rewards earned on eligible purchases.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">
            Current membership
          </p>
          <p className="font-heading mt-1 text-lg font-extrabold text-slate-950 dark:text-white">
            {loading ? "Loading..." : membership.name || "Starter"}
          </p>
          {!loading && membership.expiresAt && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Active until {formatExpiry(membership.expiresAt)}
            </p>
          )}
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan, index) => {
          const isCurrent = membership.tier === plan.key;
          const isStarter = plan.key === "starter";
          const lowerThanCurrent =
            !isStarter &&
            currentTierIndex > -1 &&
            index < currentTierIndex;

          const busy = payingTier === plan.key;

          return (
            <article
              key={plan.key}
              className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 ${
                isCurrent
                  ? "border-indigo-300 ring-2 ring-indigo-100 dark:border-indigo-500 dark:ring-indigo-500/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div
                className={`absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r ${plan.accent}`}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    {plan.duration}
                  </p>
                  <h3 className="font-heading mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">
                    {plan.name}
                  </h3>
                </div>

                {isCurrent && (
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="font-heading text-3xl font-extrabold text-slate-950 dark:text-white">
                  {plan.priceLabel}
                </span>
                {!isStarter && (
                  <span className="pb-1 text-xs text-slate-400">
                    / 30 days
                  </span>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-2.5 text-sm leading-5 text-slate-600 dark:text-slate-300"
                  >
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {isStarter ? (
                <button
                  type="button"
                  disabled
                  className="mt-7 w-full cursor-default rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  Included for everyone
                </button>
              ) : (
                <div className="mt-7 space-y-2">
                  <button
                    type="button"
                    onClick={() => purchaseMembership(plan.key)}
                    disabled={busy || lowerThanCurrent}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      plan.key === "elite"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {busy
                      ? "Opening payment..."
                      : lowerThanCurrent
                        ? "Higher tier already active"
                        : isCurrent
                          ? `Extend ${plan.name} by 30 days`
                          : `Choose ${plan.name}`}
                  </button>

                  {!import.meta.env.PROD && !lowerThanCurrent && (
                    <button
                      type="button"
                      onClick={() => demoMembership(plan.key)}
                      disabled={busy}
                      className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400"
                    >
                      Dev: simulate successful membership payment
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        Shopora memberships do not auto-renew in this version. Renewals are
        initiated manually by the user.
      </p>
        </div>
      </div>
    </section>
  );
}
