const { readSession } = require("./adminSession");
const verifyFirebaseToken = require("./verifyFirebaseToken");
const verifyAdmin = require("./verifyAdmin");

module.exports = function verifyAdminRequest(req, res, next) {
  const session = readSession(req);
  if (session) {
    req.adminSession = session;
    return next();
  }

  return verifyFirebaseToken(req, res, () => verifyAdmin(req, res, next));
};
