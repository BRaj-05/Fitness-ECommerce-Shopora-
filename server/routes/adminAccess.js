const express = require("express");

const verifyFirebaseToken =
  require("../middleware/verifyFirebaseToken");

const router = express.Router();

function configuredAdminUids() {
  return {
    adminUid:
      String(
        process.env.ADMIN_UID || "",
      ).trim(),

    superAdminUid:
      String(
        process.env.SUPER_ADMIN_UID || "",
      ).trim(),
  };
}

router.get(
  "/",
  verifyFirebaseToken,
  (req, res) => {
    const {
      adminUid,
      superAdminUid,
    } = configuredAdminUids();

    if (!adminUid && !superAdminUid) {
      return res.status(503).json({
        allowed: false,
        error:
          "Admin UID is not configured on the server",
      });
    }

    const uid =
      req.user?.uid || "";

    const isSuperAdmin =
      Boolean(
        superAdminUid &&
          uid === superAdminUid,
      );

    const isAdmin =
      isSuperAdmin ||
      Boolean(
        adminUid &&
          uid === adminUid,
      );

    if (!isAdmin) {
      return res.status(403).json({
        allowed: false,
        error:
          "This account is not an administrator",
      });
    }

    return res.json({
      allowed: true,
      role:
        isSuperAdmin
          ? "super-admin"
          : "admin",

      user: {
        uid,
        email:
          req.user?.email ||
          null,
        username:
          req.user?.username ||
          null,
        provider:
          req.user
            ?.authProvider ||
          req.user
            ?.firebase
            ?.sign_in_provider ||
          null,
      },
    });
  },
);

module.exports = router;
