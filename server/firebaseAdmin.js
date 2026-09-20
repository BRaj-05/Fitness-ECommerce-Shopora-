const admin = require("firebase-admin");

function hasUsableFirebaseEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return false;

  const placeholderText = [
    "your_firebase",
    "YOUR_PRIVATE_KEY",
    "replace_me",
  ];

  return !placeholderText.some((text) =>
    `${projectId} ${clientEmail} ${privateKey}`.includes(text),
  );
}

if (!admin.apps.length) {
  try {
    if (hasUsableFirebaseEnv()) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });

      console.log("Firebase Admin initialized");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });

      console.log("Firebase Admin initialized using application default credentials");
    } else {
      console.warn(
        "Firebase Admin is not configured. Public APIs can start, but authenticated APIs will return 503 until Firebase credentials are added.",
      );
    }
  } catch (error) {
    console.warn(
      `Firebase Admin initialization skipped: ${error.message}`,
    );
  }
}

admin.isReady = () => admin.apps.length > 0;

module.exports = admin;
