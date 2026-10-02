// backend/src/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMonthlyOrders,
  getMonthlyRevenue,
  getOrdersByStatus,
  getUsersByRole,
  getProductsByCategory,
  getTopSellingProducts,
  getSalesTimeSeries,
} = require('../controllers/analyticsController');

router.use(protect); // all routes require authentication
router.use(authorize('admin'));

router.get('/monthly-orders', getMonthlyOrders);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/orders-status', getOrdersByStatus);
router.get('/users-role', getUsersByRole);
router.get('/products-category', getProductsByCategory);
router.get('/top-selling', getTopSellingProducts);
router.get('/sales', getSalesTimeSeries);

module.exports = router;
