const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getAdminDashboard,
  getAllUsers,
  getAllFarmers,
  approveFarmer,
  rejectFarmer,
  getFarmerPublicProfile,
  removeUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public: list all approved farmers
router.route('/farmers')
  .get(getAllFarmers);

router.route('/')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/farmer/:id/profile')
  .get(getFarmerPublicProfile);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/admin/dashboard')
  .get(protect, authorize('admin'), getAdminDashboard);

router.route('/admin/farmers/:id/approve')
  .put(protect, authorize('admin'), approveFarmer);

router.route('/admin/farmers/:id/reject')
  .put(protect, authorize('admin'), rejectFarmer);

router.route('/admin/:id/remove')
  .delete(protect, authorize('admin'), removeUser);

module.exports = router;
