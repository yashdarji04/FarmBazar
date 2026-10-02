const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, authorize('customer'), getCart)
  .post(protect, authorize('customer'), addToCart)
  .delete(protect, authorize('customer'), clearCart);

router.route('/:productId')
  .put(protect, authorize('customer'), updateCartItem)
  .delete(protect, authorize('customer'), removeFromCart);

module.exports = router;
