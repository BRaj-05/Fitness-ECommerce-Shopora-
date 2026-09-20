const admin = require("../firebaseAdmin");

const SUPER_ADMIN_UID =
  process.env.SUPER_ADMIN_UID ||
  process.env.VITE_SUPER_ADMIN_UID ||
  "";

const isDev = process.env.NODE_ENV !== "production";
const DEV_PREFIX = "dev:";

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized - no token provided",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (isDev && token.startsWith(DEV_PREFIX)) {
    const email = token.slice(DEV_PREFIX.length);
    const uid =
      process.env.DEV_ADMIN_UID ||
      `dev-admin-${(email || "").replace(/[^a-z0-9]/gi, "")}`;

    req.user = {
      uid,
      email,
      email_verified: true,
      name: "Dev Admin",
    };

    return next();
  }

  if (!admin.isReady?.()) {
    return res.status(503).json({
      error:
        "Authentication service is not configured. Add Firebase Admin credentials to server/.env.",
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const isLocalPasswordSession =
      decoded.authProvider === "local";

    if (
      !decoded.email_verified &&
      decoded.uid !== SUPER_ADMIN_UID &&
      !isLocalPasswordSession
    ) {
      return res.status(403).json({
        error:
          "Forbidden — email not verified",
      });
    }

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized - invalid or expired token",
    });
  }
};

module.exports = verifyFirebaseToken;
