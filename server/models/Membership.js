const mongoose = require("mongoose");

const membershipTransactionSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: ["pro", "elite"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: true },
);

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["starter", "pro", "elite"],
      default: "starter",
    },
    status: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastPaymentId: {
      type: String,
      default: null,
    },
    lastRazorpayOrderId: {
      type: String,
      default: null,
    },
    transactions: {
      type: [membershipTransactionSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Membership", membershipSchema);
