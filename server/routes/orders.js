const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const ensureOwnership = require('../middleware/ownership');

const ensureOrderOwnership = ensureOwnership('Forbidden - you can only view your own orders');

router.post(
  '/',
  verifyFirebaseToken,
  (_req, res) =>
    res.status(410).json({
      error:
        'Direct order creation is disabled. Complete Razorpay payment verification first.',
    }),
);

/**
 * @route   GET /api/orders/:userId
 * @desc    Returns all orders for a given user, sorted by most recent first
 * @access  Private
 */
router.get('/:userId', verifyFirebaseToken, ensureOrderOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
