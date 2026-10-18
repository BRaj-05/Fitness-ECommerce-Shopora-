const mongoose = require("mongoose");

const refreshSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RefreshSession", refreshSessionSchema);
