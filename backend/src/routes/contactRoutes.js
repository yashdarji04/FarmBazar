const express = require('express');
const router = express.Router();
const { 
  sendContactMessage,
  getAllInquiries,
  updateInquiryStatus
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', sendContactMessage);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllInquiries);
router.put('/admin/:id/status', protect, authorize('admin'), updateInquiryStatus);

module.exports = router;
