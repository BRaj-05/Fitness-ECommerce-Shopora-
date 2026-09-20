const mongoose = require("mongoose");

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
      required: true,
      unique: true,
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
      required: true,
      select: false,
    },

    provider: {
      type: String,
      enum: ["local"],
      default: "local",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "AuthUser",
  authUserSchema,
);
