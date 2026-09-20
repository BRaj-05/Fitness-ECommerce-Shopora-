const mongoose =
  require("mongoose");

const OrderItemSchema =
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
      },
    },
    {
      _id: false,
    },
  );

const ShippingAddressSchema =
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

const OrderSchema =
  new mongoose.Schema(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      items: {
        type: [
          OrderItemSchema,
        ],
        required: true,
      },

      subtotal: {
        type: Number,
        default: 0,
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

      shippingAddress: {
        type:
          ShippingAddressSchema,
        default: null,
      },

      razorpayOrderId: {
        type: String,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "created",
          "paid",
          "failed",
        ],
        default: "created",
      },

      paymentId: {
        type: String,
        unique: true,
        sparse: true,
      },
    },
    {
      timestamps: true,
    },
  );

module.exports =
  mongoose.model(
    "Order",
    OrderSchema,
  );
