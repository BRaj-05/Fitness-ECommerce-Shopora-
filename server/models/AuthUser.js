const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["local", "google", "github"], required: true },
    providerAccountId: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const authUserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    // bcrypt is one-way. Never decrypt this field.
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providers: { type: [providerSchema], default: [] },
    avatarUrl: { type: String, default: "" },
    role: { type: String, enum: ["customer", "admin", "super-admin"], default: "customer" },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

authUserSchema.index(
  { "providers.provider": 1, "providers.providerAccountId": 1 },
  { unique: true, sparse: true },
);

module.exports = mongoose.model(
  "AuthUser",
  authUserSchema,
);
