const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getFarmerReviews,
  getAllReviews,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/').post(protect, createReview);
router.route('/admin/all').get(protect, authorize('admin'), getAllReviews);
router.route('/product/:productId').get(getProductReviews);
router.route('/farmer/:farmerId').get(getFarmerReviews);

module.exports = router;
