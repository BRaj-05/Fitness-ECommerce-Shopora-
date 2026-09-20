const mongoose =
  require("mongoose");

const paymentSessionItemSchema =
  new mongoose.Schema(
    {
      productId: {
        type: Number,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    },
  );

const shippingAddressSchema =
  new mongoose.Schema(
    {
      id: String,
      label: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: String,
      country: String,
      phone: String,
    },
    {
      _id: false,
    },
  );

const paymentSessionSchema =
  new mongoose.Schema(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      paymentId: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
      },

      orderId: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Order",
        default: null,
      },

      items: {
        type: [
          paymentSessionItemSchema,
        ],
        required: true,
      },

      subtotal: {
        type: Number,
        required: true,
      },

      discountPercent: {
        type: Number,
        default: 0,
      },

      discountAmount: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        required: true,
      },

      currency: {
        type: String,
        default: "INR",
      },

      cartHash: {
        type: String,
        required: true,
      },

      shippingAddress: {
        type:
          shippingAddressSchema,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "created",
          "paid",
          "failed",
        ],
        default: "created",
        index: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },
    },
    {
      timestamps: true,
    },
  );

paymentSessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

module.exports =
  mongoose.model(
    "PaymentSession",
    paymentSessionSchema,
  );
