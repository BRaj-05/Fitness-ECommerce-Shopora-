const express = require('express');
const router = express.Router();

// POST /api/dev/login
// Development-only route returning a lightweight dev token accepted by the
// server's token verification in development mode. This route is intentionally
// simple and MUST NOT be enabled or used in production.
router.post('/login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  const { email } = req.body || {};
  const devEmail = process.env.DEV_ADMIN_EMAIL;

  if (!devEmail) {
    return res.status(400).json({ error: 'DEV_ADMIN_EMAIL not configured on server' });
  }

  if (!email || email !== devEmail) {
    return res.status(401).json({ error: 'Invalid dev credentials' });
  }

  // Return a simple dev token using the agreed prefix: 'dev:<email>'
  const token = `dev:${email}`;
  res.json({ ok: true, token });
});

module.exports = router;
