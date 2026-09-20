const express =
  require("express");

const Razorpay =
  require("razorpay");

const crypto =
  require("crypto");

const Rewards =
  require("../models/Rewards");

const Order =
  require("../models/Order");

const PaymentSession =
  require("../models/PaymentSession");

const UserProfile =
  require("../models/UserProfile");

const rewardsConfig =
  require("../config/rewardsConfig");

const verifyFirebaseToken =
  require("../middleware/verifyFirebaseToken");

const {
  sendFirstPurchaseEmail,
} =
  require("../services/firstPurchaseEmailService");

const {
  createOrder,
} =
  require("../services/orderService");

const {
  getCheckoutPricing,
  getCurrentCartHash,
} =
  require("../services/checkoutPricingService");

const {
  getRewardMultiplier,
} =
  require("../services/membershipService");

const router =
  express.Router();

const razorpay =
  process.env
    .RAZORPAY_KEY_ID &&
  process.env
    .RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id:
          process.env
            .RAZORPAY_KEY_ID,

        key_secret:
          process.env
            .RAZORPAY_KEY_SECRET,
      })
    : null;

function assertOwnUser(
  req,
  res,
  userId,
) {
  if (
    !userId ||
    req.user?.uid !==
      userId
  ) {
    res.status(403).json({
      error:
        "Forbidden — payment user mismatch",
    });

    return false;
  }

  return true;
}

function paymentConfigured() {
  return Boolean(
    razorpay &&
      process.env
        .RAZORPAY_KEY_ID &&
      process.env
        .RAZORPAY_KEY_SECRET,
  );
}

function safeSignatureMatch(
  expected,
  received,
) {
  const expectedBuffer =
    Buffer.from(
      String(expected),
      "utf8",
    );

  const receivedBuffer =
    Buffer.from(
      String(received || ""),
      "utf8",
    );

  return (
    expectedBuffer.length ===
      receivedBuffer.length &&
    crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer,
    )
  );
}

async function markDiscountUsed(
  userId,
  discountPercent,
) {
  if (
    Number(
      discountPercent || 0,
    ) <= 0
  ) {
    return;
  }

  await UserProfile.findOneAndUpdate(
    {
      userId,
      discountUsed: false,
    },
    {
      $set: {
        discountUsed: true,
      },
    },
  );
}

async function awardPurchaseRewards(
  userId,
  order,
) {
  let rewards =
    await Rewards.findOne({
      userId,
    });

  if (!rewards) {
    rewards =
      await Rewards.create({
        userId,
        pointsBalance: 0,
        transactions: [],
      });
  }

  const alreadyCredited =
    rewards.transactions.some(
      (transaction) =>
        transaction.orderId ===
        String(
          order._id,
        ),
    );

  if (alreadyCredited) {
    return;
  }

  const purchaseAmount =
    Number(
      order.total || 0,
    );

  const rewardMultiplier =
    await getRewardMultiplier(
      userId,
    );

  let points =
    Math.floor(
      purchaseAmount *
        rewardsConfig
          .POINTS_PER_RUPEE *
        rewardMultiplier,
    );

  if (
    rewards.transactions
      .length === 0
  ) {
    points +=
      rewardsConfig
        .FIRST_PURCHASE_BONUS;
  }

  rewards.transactions.push({
    type: "earned",
    points,
    source: "purchase",
    orderId:
      String(
        order._id,
      ),

    description:
      rewardMultiplier > 1
        ? `Points earned from purchase (${rewardMultiplier}× Shopora membership)`
        : "Points earned from purchase",

    createdAt:
      new Date(),
  });

  rewards.pointsBalance +=
    points;

  await rewards.save();
}

async function finalisePaidOrder({
  userId,
  paymentId,
  razorpayOrderId,
  pricing,
  shippingAddress,
}) {
  const existingOrder =
    await Order.findOne({
      paymentId,
    });

  if (existingOrder) {
    return existingOrder;
  }

  const order =
    await createOrder(
      userId,
      pricing.items.map(
        (item) => ({
          productId:
            item.productId,
          quantity:
            item.quantity,
        }),
      ),
      pricing,
      shippingAddress,
      razorpayOrderId,
    );

  order.paymentId =
    paymentId;

  order.status =
    "paid";

  order.razorpayOrderId =
    razorpayOrderId;

  await order.save();

  await markDiscountUsed(
    userId,
    pricing.discountPercent,
  );

  try {
    await awardPurchaseRewards(
      userId,
      order,
    );
  } catch (
    rewardError
  ) {
    console.error(
      "Reward earning failed:",
      rewardError.message,
    );
  }

  sendFirstPurchaseEmail(
    userId,
    order,
  ).catch((emailError) => {
    console.error(
      "First-purchase email service error:",
      emailError.message,
    );
  });

  return order;
}

router.get(
  "/config",
  (_req, res) => {
    const key =
      process.env
        .RAZORPAY_KEY_ID ||
      "";

    res.json({
      configured:
        paymentConfigured(),

      mode:
        key.startsWith(
          "rzp_test_",
        )
          ? "test"
          : key
            ? "live"
            : "unconfigured",
    });
  },
);

router.post(
  "/create-order",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const {
        userId,
        addressId,
      } = req.body;

      if (
        !assertOwnUser(
          req,
          res,
          userId,
        )
      ) {
        return;
      }

      if (
        !paymentConfigured()
      ) {
        return res
          .status(503)
          .json({
            error:
              "Razorpay is not configured on the server",
          });
      }

      const pricing =
        await getCheckoutPricing({
          userId,
          addressId,
        });

      const shortId =
        String(userId).slice(
          -8,
        );

      const shortTs =
        String(
          Date.now(),
        ).slice(-8);

      const receipt =
        `sh_${shortId}_${shortTs}`;

      const order =
        await razorpay.orders.create(
          {
            amount:
              Math.round(
                pricing.total *
                  100,
              ),

            currency:
              pricing.currency,

            receipt,

            notes: {
              type:
                "shopora-product-order",

              userId,

              cartHash:
                pricing.cartHash,
            },
          },
        );

      const expiresAt =
        new Date(
          Date.now() +
            30 *
              60 *
              1000,
        );

      await PaymentSession.create(
        {
          userId,
          razorpayOrderId:
            order.id,

          items:
            pricing.items,

          subtotal:
            pricing.subtotal,

          discountPercent:
            pricing.discountPercent,

          discountAmount:
            pricing.discountAmount,

          total:
            pricing.total,

          currency:
            pricing.currency,

          cartHash:
            pricing.cartHash,

          shippingAddress:
            pricing.shippingAddress,

          status:
            "created",

          expiresAt,
        },
      );

      return res.json({
        order: {
          id:
            order.id,
          amount:
            order.amount,
          currency:
            order.currency,
          receipt:
            order.receipt,
        },

        pricing: {
          subtotal:
            pricing.subtotal,

          discountPercent:
            pricing.discountPercent,

          discountAmount:
            pricing.discountAmount,

          total:
            pricing.total,

          currency:
            pricing.currency,
        },
      });
    } catch (error) {
      console.error(
        "Razorpay create-order error:",
        error,
      );

      const status =
        [
          "Cart is empty",
          "Select a valid shipping address",
        ].includes(
          error.message,
        ) ||
        error.message.includes(
          "stock",
        ) ||
        error.message.includes(
          "Reservation",
        )
          ? 400
          : 500;

      return res
        .status(status)
        .json({
          error:
            error.message ||
            "Unable to create payment order",
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
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId,
      } = req.body;

      if (
        !assertOwnUser(
          req,
          res,
          userId,
        )
      ) {
        return;
      }

      if (
        !paymentConfigured()
      ) {
        return res
          .status(503)
          .json({
            error:
              "Razorpay is not configured on the server",
          });
      }

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res
          .status(400)
          .json({
            error:
              "Missing required payment fields",
          });
      }

      const expected =
        crypto
          .createHmac(
            "sha256",
            process.env
              .RAZORPAY_KEY_SECRET,
          )
          .update(
            `${razorpay_order_id}|${razorpay_payment_id}`,
          )
          .digest("hex");

      if (
        !safeSignatureMatch(
          expected,
          razorpay_signature,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Payment signature verification failed",
          });
      }

      const session =
        await PaymentSession.findOne({
          userId,
          razorpayOrderId:
            razorpay_order_id,
        });

      if (!session) {
        return res
          .status(404)
          .json({
            error:
              "Payment session not found or expired",
          });
      }

      if (
        session.status ===
        "paid"
      ) {
        const existing =
          session.orderId
            ? await Order.findById(
                session.orderId,
              )
            : await Order.findOne(
                {
                  paymentId:
                    razorpay_payment_id,
                },
              );

        return res.json({
          success: true,
          order: existing,
          alreadyProcessed:
            true,
        });
      }

      if (
        session.expiresAt <
        new Date()
      ) {
        session.status =
          "failed";

        await session.save();

        return res
          .status(400)
          .json({
            error:
              "Payment session expired. Return to checkout and try again.",
          });
      }

      const currentCartHash =
        await getCurrentCartHash(
          userId,
        );

      if (
        currentCartHash !==
        session.cartHash
      ) {
        return res
          .status(409)
          .json({
            error:
              "Your cart changed after payment started. Return to checkout and try again.",
          });
      }

      const payment =
        await razorpay.payments.fetch(
          razorpay_payment_id,
        );

      if (
        payment.order_id !==
        razorpay_order_id
      ) {
        return res
          .status(400)
          .json({
            error:
              "Payment order mismatch",
          });
      }

      if (
        Number(
          payment.amount,
        ) !==
        Math.round(
          Number(
            session.total,
          ) * 100,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Payment amount mismatch",
          });
      }

      if (
        String(
          payment.currency,
        ).toUpperCase() !==
        String(
          session.currency,
        ).toUpperCase()
      ) {
        return res
          .status(400)
          .json({
            error:
              "Payment currency mismatch",
          });
      }

      if (
        ![
          "captured",
          "authorized",
        ].includes(
          payment.status,
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              `Payment is not verified as successful (${payment.status})`,
          });
      }

      const pricing = {
        items:
          session.items.map(
            (item) => ({
              productId:
                item.productId,
              quantity:
                item.quantity,
              price:
                item.price,
            }),
          ),

        subtotal:
          session.subtotal,

        discountPercent:
          session.discountPercent,

        discountAmount:
          session.discountAmount,

        total:
          session.total,

        currency:
          session.currency,

        shippingAddress:
          session.shippingAddress,
      };

      const order =
        await finalisePaidOrder(
          {
            userId,

            paymentId:
              razorpay_payment_id,

            razorpayOrderId:
              razorpay_order_id,

            pricing,

            shippingAddress:
              session.shippingAddress,
          },
        );

      session.paymentId =
        razorpay_payment_id;

      session.orderId =
        order._id;

      session.status =
        "paid";

      // Keep paid session for audit instead of TTL deletion.
      session.expiresAt =
        new Date(
          Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000,
        );

      await session.save();

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "verify-payment error:",
        error,
      );

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Payment verification failed",
        });
    }
  },
);

router.post(
  "/clear-cart",
  verifyFirebaseToken,
  async (req, res) => {
    const {
      userId,
    } = req.body;

    if (
      !assertOwnUser(
        req,
        res,
        userId,
      )
    ) {
      return;
    }

    // Normal paid checkout no longer calls this route.
    // Keep it for an explicit authenticated cart-clear action.
    const Cart =
      require("../models/Cart");

    const Product =
      require("../models/Product");

    try {
      const cart =
        await Cart.findOne({
          userId,
        });

      if (!cart) {
        return res.json({
          success: true,
        });
      }

      for (
        const item of
          cart.items
      ) {
        await Product.findOneAndUpdate(
          {
            productId:
              Number(
                item.productId,
              ),

            reserved: {
              $gte:
                item.quantity,
            },
          },
          {
            $inc: {
              reserved:
                -item.quantity,
            },
          },
        );
      }

      cart.items = [];

      await cart.save();

      return res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "clear-cart error:",
        error,
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to clear cart",
        });
    }
  },
);

router.post(
  "/demo-success",
  verifyFirebaseToken,
  async (req, res) => {
    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      return res
        .status(404)
        .json({
          error:
            "Not found",
        });
    }

    try {
      const {
        userId,
        addressId,
      } = req.body;

      if (
        !assertOwnUser(
          req,
          res,
          userId,
        )
      ) {
        return;
      }

      const pricing =
        await getCheckoutPricing({
          userId,
          addressId,
        });

      const fakePaymentId =
        `pay_DEMO_${Date.now()}`;

      const fakeOrderId =
        `order_DEMO_${Date.now()}`;

      const order =
        await finalisePaidOrder(
          {
            userId,

            paymentId:
              fakePaymentId,

            razorpayOrderId:
              fakeOrderId,

            pricing,

            shippingAddress:
              pricing.shippingAddress,
          },
        );

      return res.json({
        success: true,
        paymentId:
          fakePaymentId,
        order,
        pricing: {
          subtotal:
            pricing.subtotal,
          discountPercent:
            pricing.discountPercent,
          discountAmount:
            pricing.discountAmount,
          total:
            pricing.total,
          currency:
            pricing.currency,
        },
      });
    } catch (error) {
      console.error(
        "demo-success error:",
        error,
      );

      return res
        .status(400)
        .json({
          error:
            error.message ||
            "Demo order failed",
        });
    }
  },
);

module.exports =
  router;
