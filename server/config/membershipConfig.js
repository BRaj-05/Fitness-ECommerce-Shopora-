const MEMBERSHIP_PLANS = Object.freeze({
  starter: Object.freeze({
    key: "starter",
    name: "Starter",
    price: 0,
    durationDays: null,
    rewardMultiplier: 1,
  }),
  pro: Object.freeze({
    key: "pro",
    name: "Pro",
    price: 499,
    durationDays: 30,
    rewardMultiplier: 1.25,
  }),
  elite: Object.freeze({
    key: "elite",
    name: "Elite",
    price: 1499,
    durationDays: 30,
    rewardMultiplier: 1.5,
  }),
});

function getMembershipPlan(tier) {
  return MEMBERSHIP_PLANS[String(tier || "").toLowerCase()] || null;
}

function getPaidMembershipPlan(tier) {
  const plan = getMembershipPlan(tier);
  if (!plan || plan.price <= 0 || !plan.durationDays) return null;
  return plan;
}

module.exports = {
  MEMBERSHIP_PLANS,
  getMembershipPlan,
  getPaidMembershipPlan,
};
