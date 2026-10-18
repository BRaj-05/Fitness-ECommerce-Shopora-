const { getAuth } = require('firebase-admin/auth');
const AuthUser = require('../models/AuthUser');
const UserProfile = require('../models/UserProfile');

module.exports = async (uid) => {
  const account = await AuthUser.findOne({ uid }).lean();
  if (account) {
    return {
      displayName: account.name || "â€”",
      photoURL: account.avatarUrl || null,
      email: account.email || "â€”",
    };
  }
  const profile = await UserProfile.findOne({ userId: uid }).lean();
  if (profile?.email || profile?.name) {
    return {
      displayName: profile.name || "â€”",
      photoURL: profile.photoURL || null,
      email: profile.email || "â€”",
    };
  }
  try {
    const user = await getAuth().getUser(uid);
    return {
      displayName: user.displayName || "—",
      photoURL: user.photoURL || null,
      email: user.email || "—",
    };
  } catch (err) {
    return { displayName: "—", photoURL: null, email: "—" };
  }
};
