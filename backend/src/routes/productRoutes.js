const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, authorize('farmer', 'admin'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('farmer', 'admin'), updateProduct)
  .delete(protect, authorize('farmer', 'admin'), deleteProduct);

module.exports = router;
