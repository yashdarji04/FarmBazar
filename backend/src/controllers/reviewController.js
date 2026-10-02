const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
const { createNotification, notifyAllAdmins } = require('../utils/notificationHelper');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private/Customer
const createReview = asyncHandler(async (req, res) => {
  const { productId, orderId, rating, comment } = req.body;

  // Check if order exists and is delivered
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.customerId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to review this order');
  }

  if (order.orderStatus !== 'Delivered') {
    res.status(400);
    throw new Error('You can only review delivered products');
  }

  // Check if product exists in order
  const itemExists = order.items.find(item => item.product.toString() === productId);
  if (!itemExists) {
    res.status(400);
    throw new Error('Product not found in this order');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if already reviewed
  const alreadyReviewed = await Review.findOne({
    product: productId,
    order: orderId,
    user: req.user._id
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed for this order');
  }

  const review = await Review.create({
    product: productId,
    order: orderId,
    user: req.user._id,
    farmer: product.farmerId,
    rating: Number(rating),
    comment,
  });

  // Mark order as reviewed
  order.isReviewed = true;
  await order.save();

  // Update Product Rating
  const productReviews = await Review.find({ product: productId });
  product.totalReviews = productReviews.length;
  product.rating = productReviews.reduce((acc, item) => item.rating + acc, 0) / productReviews.length;
  await product.save();

  // Update Farmer Rating
  const farmerReviews = await Review.find({ farmer: product.farmerId });
  const farmer = await FarmerProfile.findById(product.farmerId);
  farmer.rating = farmerReviews.reduce((acc, item) => item.rating + acc, 0) / farmerReviews.length;
  await farmer.save();

  // Notify farmer about new review
  const io = req.app.get('io');
  if (io && farmer.userId) {
    await createNotification(io, {
      recipientId: farmer.userId,
      type: 'new_review',
      title: 'New Review Received',
      message: `${req.user.name} gave ${product.name} a ${rating}-star review${comment ? ': "' + comment.substring(0, 60) + (comment.length > 60 ? '...' : '') + '"' : '.'}`,
      icon: 'star',
      color: 'amber',
      link: `/products/${productId}`,
      referenceId: review._id,
    });

    // Notify admins about new review
    await notifyAllAdmins(io, {
      type: 'new_review',
      title: 'New Product Review',
      message: `${req.user.name} reviewed ${product.name} (${rating} stars).`,
      icon: 'star',
      color: 'amber',
      link: '/dashboard/admin?tab=support',
      referenceId: review._id,
    });
  }

  res.status(201).json({ success: true, data: review });
});

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).populate('user', 'name profileImage');
  res.json({ success: true, data: reviews });
});

// @desc    Get farmer reviews
// @route   GET /api/reviews/farmer/:farmerId
// @access  Public
const getFarmerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmer: req.params.farmerId }).populate('user', 'name profileImage').populate('product', 'name');
  res.json({ success: true, data: reviews });
});

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate('user', 'name email')
    .populate('product', 'name')
    .populate('farmer', 'farmName')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, data: reviews });
});

module.exports = {
  createReview,
  getProductReviews,
  getFarmerReviews,
  getAllReviews,
};
