// backend/src/controllers/analyticsController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

/**
 * @desc    Get monthly order counts for a given year
 * @route   GET /api/analytics/monthly-orders?year=2023
 * @access  Private/Admin
 */
const getMonthlyOrders = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const raw = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
    { $project: { month: '$_id', count: 1, _id: 0 } },
    { $sort: { month: 1 } },
  ]);
  const data = Array.from({ length: 12 }, (_, i) => {
    const found = raw.find((r) => r.month === i + 1);
    return found ? found.count : 0;
  });
  res.json({ success: true, year, data });
});

/**
 * @desc    Get monthly revenue (INR) for delivered/completed orders
 * @route   GET /api/analytics/monthly-revenue?year=2023
 * @access  Private/Admin
 */
const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const raw = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end }, orderStatus: { $in: ['Delivered', 'Completed'] } } },
    { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalAmount' } } },
    { $project: { month: '$_id', revenue: 1, _id: 0 } },
    { $sort: { month: 1 } },
  ]);
  const data = Array.from({ length: 12 }, (_, i) => {
    const found = raw.find((r) => r.month === i + 1);
    return found ? found.revenue : 0;
  });
  res.json({ success: true, year, data });
});

/**
 * @desc    Get order counts grouped by status
 * @route   GET /api/analytics/orders-status
 * @access  Private/Admin
 */
const getOrdersByStatus = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const matchQuery = {};
  if (start || end) {
    matchQuery.createdAt = {};
    if (start) matchQuery.createdAt.$gte = new Date(start);
    if (end) matchQuery.createdAt.$lte = new Date(end);
  }
  
  const raw = await Order.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);
  res.json({ success: true, data: raw });
});

/**
 * @desc    Get user counts by role (customer, farmer, admin)
 * @route   GET /api/analytics/users-role
 * @access  Private/Admin
 */
const getUsersByRole = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const matchQuery = {};
  if (start || end) {
    matchQuery.createdAt = {};
    if (start) matchQuery.createdAt.$gte = new Date(start);
    if (end) matchQuery.createdAt.$lte = new Date(end);
  }
  
  const raw = await User.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $project: { role: '$_id', count: 1, _id: 0 } },
  ]);
  res.json({ success: true, data: raw });
});

/**
 * @desc    Get product counts per category
 * @route   GET /api/analytics/products-category
 * @access  Private/Admin
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const matchQuery = {};
  if (start || end) {
    matchQuery.createdAt = {};
    if (start) matchQuery.createdAt.$gte = new Date(start);
    if (end) matchQuery.createdAt.$lte = new Date(end);
  }
  
  const raw = await Product.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { category: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: raw });
});

/**
 * @desc    Top‑selling products by quantity (delivered/completed orders)
 * @route   GET /api/analytics/top-selling
 * @access  Private/Admin
 */
const getTopSellingProducts = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const matchQuery = { orderStatus: { $in: ['Delivered', 'Completed'] } };
  if (start || end) {
    matchQuery.createdAt = {};
    if (start) matchQuery.createdAt.$gte = new Date(start);
    if (end) matchQuery.createdAt.$lte = new Date(end);
  }
  
  const raw = await Order.aggregate([
    { $match: matchQuery },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', quantity: { $sum: '$items.quantity' } } },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $project: { _id: 0, productId: '$_id', name: '$product.name', quantity: 1 } },
    { $sort: { quantity: -1 } },
    { $limit: 10 },
  ]);
  res.json({ success: true, data: raw });
});

/**
 * @desc    Sales time series (daily or weekly) within a date range
 * @route   GET /api/analytics/sales?start=2023-01-01&end=2023-12-31&interval=daily|weekly
 * @access  Private/Admin
 */
const getSalesTimeSeries = asyncHandler(async (req, res) => {
  const { start, end, interval = 'daily' } = req.query;
  const startDate = start ? new Date(start) : new Date('1970-01-01');
  const endDate = end ? new Date(end) : new Date();
  const groupId = interval === 'weekly'
    ? { isoWeek: { $isoWeek: '$createdAt' }, year: { $isoWeekYear: '$createdAt' } }
    : { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } };
  const raw = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, orderStatus: { $in: ['Delivered', 'Completed'] } } },
    { $group: { _id: groupId, revenue: { $sum: '$totalAmount' } } },
    { $sort: { '_id.year': 1, '_id.isoWeek': 1, '_id.day': 1 } },
  ]);
  const data = raw.map((r) => {
    if (interval === 'weekly') {
      const label = `W${r._id.isoWeek}, ${r._id.year}`;
      return { label, revenue: r.revenue };
    }
    return { label: r._id.day, revenue: r.revenue };
  });
  res.json({ success: true, interval, data });
});

module.exports = {
  getMonthlyOrders,
  getMonthlyRevenue,
  getOrdersByStatus,
  getUsersByRole,
  getProductsByCategory,
  getTopSellingProducts,
  getSalesTimeSeries,
};
