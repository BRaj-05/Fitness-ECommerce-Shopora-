const { readSession } = require("./adminSession");
const verifyFirebaseToken = require("./verifyFirebaseToken");
const verifyAdmin = require("./verifyAdmin");

module.exports = function verifyAdminRequest(req, res, next) {
  const session = readSession(req);
  if (session) {
    req.adminSession = session;
    req.admin = { authenticated: true, source: "env-session", email: session.email };
    return next();
  }

  return verifyFirebaseToken(req, res, () => verifyAdmin(req, res, () => {
    req.admin = { authenticated: true, source: req.user?.authProvider || "shopora", email: req.user?.email || null };
    next();
  }));
};
