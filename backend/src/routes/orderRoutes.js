const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getFarmerOrders,
  getAllOrders,
  getAllPayments,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/admin/all').get(protect, authorize('admin'), getAllOrders);
router.route('/admin/payments').get(protect, authorize('admin'), getAllPayments);
router.route('/').post(protect, authorize('customer'), addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/farmer/all').get(protect, authorize('farmer', 'admin'), getFarmerOrders);
router.route('/farmer').get(protect, authorize('farmer', 'admin'), getFarmerOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, authorize('farmer', 'admin'), updateOrderStatus);
router.route('/:id/farmer-status').put(protect, authorize('farmer', 'admin'), updateOrderStatus);

module.exports = router;
