const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payment/create-payment-intent
// Creates a Stripe PaymentIntent and returns the client_secret to the frontend
router.post('/create-payment-intent', protect, asyncHandler(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const { amount, currency = 'inr' } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('A valid amount is required');
  }

  // Stripe amounts are in the smallest currency unit (paise for INR)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert ₹ to paise
    currency,
    metadata: {
      userId: req.user._id.toString(),
      userEmail: req.user.email,
    },
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
}));

// GET /api/payment/config
// Returns the Stripe publishable key to the frontend safely
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

module.exports = router;
