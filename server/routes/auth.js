const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");

const admin = require("../firebaseAdmin");
const AuthUser = require("../models/AuthUser");
const UserProfile = require("../models/UserProfile");

const router = express.Router();
const BCRYPT_ROUNDS = 12;

function firebaseReady() {
  if (typeof admin.isReady === "function") {
    return admin.isReady();
  }

  return Array.isArray(admin.apps)
    ? admin.apps.length > 0
    : Boolean(admin.apps?.length);
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function validateUsername(username) {
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return "Username must be 3-30 characters using letters, numbers, dot, underscore or hyphen";
  }

  return "";
}

function validatePassword(password) {
  if (typeof password !== "string") {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 128) {
    return "Password is too long";
  }

  return "";
}

function safeUser(account) {
  return {
    uid: account.uid,
    name: account.name,
    username: account.username,
    email: account.email,
    provider: "local",
  };
}

router.post("/register", async (req, res) => {
  if (!firebaseReady()) {
    return res.status(503).json({
      error: "Firebase Admin is not configured",
    });
  }

  const name = String(req.body.name || "")
    .trim()
    .slice(0, 80);

  const username = normalizeUsername(
    req.body.username,
  );

  const email = normalizeEmail(
    req.body.email,
  );

  const password = req.body.password;

  if (!name) {
    return res.status(400).json({
      error: "Name is required",
    });
  }

  const usernameError =
    validateUsername(username);

  if (usernameError) {
    return res.status(400).json({
      error: usernameError,
    });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      error: "Enter a valid email address",
    });
  }

  const passwordError =
    validatePassword(password);

  if (passwordError) {
    return res.status(400).json({
      error: passwordError,
    });
  }

  const existingLocal =
    await AuthUser.findOne({
      $or: [
        { email },
        { username },
      ],
    }).lean();

  if (existingLocal) {
    return res.status(409).json({
      error:
        existingLocal.email === email
          ? "An account with this email already exists"
          : "This username is already taken",
    });
  }

  // Do not silently create a second identity for a Google/Firebase email.
  try {
    await admin.auth().getUserByEmail(email);

    return res.status(409).json({
      error:
        "This email already exists with another sign-in method. Continue with Google or the existing account.",
    });
  } catch (error) {
    if (error?.code !== "auth/user-not-found") {
      console.error(
        "Firebase email lookup failed:",
        error.message,
      );

      return res.status(500).json({
        error:
          "Unable to validate this email right now",
      });
    }
  }

  const uid =
    `local_${crypto.randomUUID()}`;

  const passwordHash =
    await bcrypt.hash(
      password,
      BCRYPT_ROUNDS,
    );

  let firebaseCreated = false;
  let mongoCreated = false;

  try {
    await admin.auth().createUser({
      uid,
      email,
      displayName: name,
      emailVerified: false,
    });

    firebaseCreated = true;

    await admin.auth().setCustomUserClaims(
      uid,
      {
        authProvider: "local",
        username,
      },
    );

    const account =
      await AuthUser.create({
        uid,
        name,
        username,
        email,
        passwordHash,
      });

    mongoCreated = true;

    await UserProfile.findOneAndUpdate(
      { userId: uid },
      {
        $setOnInsert: {
          userId: uid,
          name,
          email,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    const token =
      await admin.auth().createCustomToken(
        uid,
        {
          authProvider: "local",
          username,
        },
      );

    return res.status(201).json({
      token,
      user: safeUser(account),

      session: {
        customToken: true,
        refreshToken:
          "managed-by-firebase-client",
      },
    });
  } catch (error) {
    console.error(
      "Local registration failed:",
      error.message,
    );

    if (mongoCreated) {
      try {
        await AuthUser.deleteOne({ uid });
      } catch {}
    }

    if (firebaseCreated) {
      try {
        await admin.auth().deleteUser(uid);
      } catch {}
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        error:
          "Email or username already exists",
      });
    }

    return res.status(500).json({
      error:
        "Unable to create account right now",
    });
  }
});

router.post("/login", async (req, res) => {
  if (!firebaseReady()) {
    return res.status(503).json({
      error: "Firebase Admin is not configured",
    });
  }

  const identifier =
    String(req.body.identifier || "")
      .trim()
      .toLowerCase();

  const password =
    req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({
      error:
        "Email/username and password are required",
    });
  }

  const query =
    identifier.includes("@")
      ? { email: normalizeEmail(identifier) }
      : { username: normalizeUsername(identifier) };

  const account =
    await AuthUser.findOne(query).select(
      "+passwordHash",
    );

  // Same public error for unknown username/email and wrong password.
  if (!account) {
    return res.status(401).json({
      error:
        "Invalid email/username or password",
    });
  }

  const passwordMatches =
    await bcrypt.compare(
      password,
      account.passwordHash,
    );

  if (!passwordMatches) {
    return res.status(401).json({
      error:
        "Invalid email/username or password",
    });
  }

  try {
    try {
      await admin.auth().getUser(
        account.uid,
      );
    } catch (error) {
      if (
        error?.code !==
        "auth/user-not-found"
      ) {
        throw error;
      }

      await admin.auth().createUser({
        uid: account.uid,
        email: account.email,
        displayName:
          account.name || undefined,
        emailVerified: false,
      });
    }

    await admin.auth().setCustomUserClaims(
      account.uid,
      {
        authProvider: "local",
        username: account.username,
      },
    );

    const token =
      await admin.auth().createCustomToken(
        account.uid,
        {
          authProvider: "local",
          username: account.username,
        },
      );

    return res.json({
      token,
      user: safeUser(account),

      session: {
        customToken: true,
        refreshToken:
          "managed-by-firebase-client",
      },
    });
  } catch (error) {
    console.error(
      "Local login token failed:",
      error.message,
    );

    return res.status(500).json({
      error:
        "Unable to complete sign in right now",
    });
  }
});

module.exports = router;
