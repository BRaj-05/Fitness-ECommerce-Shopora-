const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const {
  MEMBERSHIP_PLANS,
  getPaidMembershipPlan,
} = require("../config/membershipConfig");
const {
  getMembershipStatus,
  activateMembership,
} = require("../services/membershipService");

const router = express.Router();

function assertOwnUser(req, res, userId) {
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return false;
  }

  if (!req.user || req.user.uid !== userId) {
    res.status(403).json({ error: "Forbidden - user mismatch" });
    return false;
  }

  return true;
}

function getRazorpayClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function verifySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const actualBuffer = Buffer.from(String(razorpaySignature || ""), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (actualBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

router.get("/plans", (_req, res) => {
  res.json(
    Object.values(MEMBERSHIP_PLANS).map((plan) => ({
      key: plan.key,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      rewardMultiplier: plan.rewardMultiplier,
    })),
  );
});

router.get(
  "/status/:userId",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!assertOwnUser(req, res, userId)) return;

      const membership = await getMembershipStatus(userId);
      res.json(membership);
    } catch (error) {
      console.error("membership status error:", error);
      res.status(500).json({ error: "Unable to load membership" });
    }
  },
);

router.post(
  "/create-order",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const { userId, tier } = req.body;

      if (!assertOwnUser(req, res, userId)) return;

      const plan = getPaidMembershipPlan(tier);
      if (!plan) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }

      const razorpay = getRazorpayClient();
      if (!razorpay) {
        return res.status(503).json({
          error: "Razorpay is not configured on the server",
        });
      }

      const shortId = userId.slice(-8);
      const shortTs = String(Date.now()).slice(-8);

      const order = await razorpay.orders.create({
        amount: Math.round(plan.price * 100),
        currency: "INR",
        receipt: `m_${shortId}_${shortTs}`,
        notes: {
          type: "shopora_membership",
          userId,
          tier: plan.key,
        },
      });

      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        tier: plan.key,
        planName: plan.name,
        durationDays: plan.durationDays,
      });
    } catch (error) {
      console.error("membership create-order error:", error);
      res.status(500).json({
        error: "Unable to create membership payment order",
      });
    }
  },
);

router.post(
  "/verify-payment",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const {
        userId,
        tier,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      if (!assertOwnUser(req, res, userId)) return;

      const plan = getPaidMembershipPlan(tier);
      if (!plan) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          error: "Missing required payment fields",
        });
      }

      const valid = verifySignature({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      if (!valid) {
        return res.status(400).json({
          error: "Signature mismatch - membership payment not verified",
        });
      }

      const membership = await activateMembership({
        userId,
        tier: plan.key,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      });

      res.json({
        success: true,
        membership,
      });
    } catch (error) {
      console.error("membership verify-payment error:", error);
      res.status(500).json({
        error: "Unable to activate membership",
      });
    }
  },
);

router.post(
  "/demo-success",
  verifyFirebaseToken,
  async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

    try {
      const { userId, tier } = req.body;

      if (!assertOwnUser(req, res, userId)) return;

      const plan = getPaidMembershipPlan(tier);
      if (!plan) {
        return res.status(400).json({ error: "Invalid membership tier" });
      }

      const stamp = Date.now();

      const membership = await activateMembership({
        userId,
        tier: plan.key,
        paymentId: `demo_mem_pay_${stamp}`,
        razorpayOrderId: `demo_mem_order_${stamp}`,
      });

      res.json({
        success: true,
        membership,
        demo: true,
      });
    } catch (error) {
      console.error("membership demo-success error:", error);
      res.status(500).json({
        error: "Unable to activate demo membership",
      });
    }
  },
);

module.exports = router;
