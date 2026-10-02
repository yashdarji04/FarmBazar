const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Get all unique categories
// @route   GET /api/categories
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json({ success: true, data: categories });
}));

module.exports = router;
