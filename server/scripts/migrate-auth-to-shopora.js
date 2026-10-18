const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const AuthUser = require("../models/AuthUser");
const UserProfile = require("../models/UserProfile");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Membership = require("../models/Membership");
const Rewards = require("../models/Rewards");
const WorkoutLog = require("../models/WorkoutLog");

async function run() {
  const apply = process.argv.includes("--apply");
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || "Shopora" });

  const [accounts, profiles, carts, orders, memberships, rewards, workouts] = await Promise.all([
    AuthUser.find({}).lean(),
    UserProfile.find({}).lean(),
    Cart.distinct("userId"),
    Order.distinct("userId"),
    Membership.distinct("userId"),
    Rewards.distinct("userId"),
    WorkoutLog.distinct("userId"),
  ]);
  const existingIds = new Set(accounts.map((item) => item.uid));
  const candidates = profiles.filter((profile) => profile.userId && profile.email && !existingIds.has(profile.userId));
  let mapped = 0;

  if (apply) {
    for (const profile of candidates) {
      const email = String(profile.email).trim().toLowerCase();
      if (!email) continue;
      const byEmail = await AuthUser.findOne({ email });
      if (byEmail) continue;
      await AuthUser.create({
        uid: profile.userId,
        name: profile.name || email.split("@")[0],
        email,
        provider: "google",
        providers: [],
        avatarUrl: profile.photoURL || "",
      });
      mapped += 1;
    }
  }

  const ownedIds = new Set([...carts, ...orders, ...memberships, ...rewards, ...workouts].filter(Boolean));
  const knownIds = new Set([...existingIds, ...profiles.map((profile) => profile.userId)]);
  const unresolved = [...ownedIds].filter((id) => !knownIds.has(id));

  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    usersDiscovered: existingIds.size,
    localUsersPreserved: accounts.filter((item) => item.passwordHash || item.provider === "local").length,
    profilesMapped: apply ? mapped : candidates.length,
    oauthReadyAccounts: accounts.filter((item) => item.email).length + (apply ? mapped : candidates.length),
    unresolvedIdentities: unresolved.length,
  }, null, 2));
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error("Auth migration failed:", error.message);
  process.exitCode = 1;
});
