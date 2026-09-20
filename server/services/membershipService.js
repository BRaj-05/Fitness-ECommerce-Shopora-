const Membership = require("../models/Membership");
const {
  MEMBERSHIP_PLANS,
  getMembershipPlan,
  getPaidMembershipPlan,
} = require("../config/membershipConfig");

function starterStatus() {
  return {
    tier: "starter",
    name: MEMBERSHIP_PLANS.starter.name,
    status: "active",
    active: true,
    startedAt: null,
    expiresAt: null,
    rewardMultiplier: MEMBERSHIP_PLANS.starter.rewardMultiplier,
  };
}

async function getMembershipDocument(userId) {
  if (!userId) return null;

  const membership = await Membership.findOne({ userId });
  if (!membership) return null;

  if (
    membership.status === "active" &&
    membership.expiresAt &&
    membership.expiresAt.getTime() <= Date.now()
  ) {
    membership.status = "expired";
    await membership.save();
  }

  return membership;
}

async function getMembershipStatus(userId) {
  const membership = await getMembershipDocument(userId);

  if (
    !membership ||
    membership.status !== "active" ||
    !membership.expiresAt ||
    membership.expiresAt.getTime() <= Date.now()
  ) {
    return starterStatus();
  }

  const plan = getMembershipPlan(membership.tier);
  if (!plan || plan.key === "starter") return starterStatus();

  return {
    tier: plan.key,
    name: plan.name,
    status: membership.status,
    active: true,
    startedAt: membership.startedAt,
    expiresAt: membership.expiresAt,
    rewardMultiplier: plan.rewardMultiplier,
  };
}

async function getRewardMultiplier(userId) {
  const status = await getMembershipStatus(userId);
  return Number(status.rewardMultiplier || 1);
}

async function activateMembership({
  userId,
  tier,
  paymentId,
  razorpayOrderId,
}) {
  const plan = getPaidMembershipPlan(tier);

  if (!userId) throw new Error("userId is required");
  if (!plan) throw new Error("Invalid paid membership tier");
  if (!paymentId || !razorpayOrderId) {
    throw new Error("Payment identifiers are required");
  }

  const duplicate = await Membership.findOne({
    "transactions.paymentId": paymentId,
  });

  if (duplicate) {
    return getMembershipStatus(userId);
  }

  const now = new Date();
  let membership = await Membership.findOne({ userId });

  const canExtendCurrent =
    membership &&
    membership.status === "active" &&
    membership.tier === plan.key &&
    membership.expiresAt &&
    membership.expiresAt.getTime() > now.getTime();

  const extensionBase = canExtendCurrent
    ? new Date(membership.expiresAt)
    : now;

  const expiresAt = new Date(
    extensionBase.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
  );

  if (!membership) {
    membership = new Membership({ userId });
  }

  membership.tier = plan.key;
  membership.status = "active";
  membership.startedAt =
    canExtendCurrent && membership.startedAt ? membership.startedAt : now;
  membership.expiresAt = expiresAt;
  membership.lastPaymentId = paymentId;
  membership.lastRazorpayOrderId = razorpayOrderId;

  membership.transactions.push({
    tier: plan.key,
    amount: plan.price,
    razorpayOrderId,
    paymentId,
    purchasedAt: now,
    expiresAt,
  });

  await membership.save();

  return getMembershipStatus(userId);
}

module.exports = {
  getMembershipDocument,
  getMembershipStatus,
  getRewardMultiplier,
  activateMembership,
};
