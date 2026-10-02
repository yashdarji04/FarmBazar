const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const category = req.query.category ? { category: req.query.category } : {};
  const city = req.query.city ? { city: { $regex: req.query.city, $options: 'i' } } : {};
  
  let farmerFilter = {};
  if (req.query.farmerId) {
    const profileByUserId = await FarmerProfile.findOne({ userId: req.query.farmerId });
    if (profileByUserId) {
      farmerFilter = { farmerId: profileByUserId._id };
    } else {
      farmerFilter = { farmerId: req.query.farmerId };
    }
  }
  
  const filter = { ...keyword, ...category, ...city, ...farmerFilter };
  
  // Only filter by availability for public searches, allow farmers to see all their products
  if (!req.query.farmerId) {
    filter.isAvailable = true;
  }

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('farmerId', 'farmName verificationStatus rating')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    }
  });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('farmerId', 'farmName ownerName farmImage rating verificationStatus city');

  if (product) {
    res.json({ success: true, data: product });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Farmer
const createProduct = asyncHandler(async (req, res) => {
  const farmerProfile = await FarmerProfile.findOne({ userId: req.user._id });
  
  if (!farmerProfile || farmerProfile.verificationStatus !== 'approved') {
    res.status(403);
    throw new Error('Only verified farmers can create products');
  }

  const { name, category, description, price, quantity, unit, images, harvestDate, expiryDate, isOrganic, city } = req.body;

  const product = new Product({
    farmerId: farmerProfile._id,
    name,
    category,
    description,
    price,
    quantity,
    unit,
    images: images || [],
    harvestDate,
    expiryDate,
    isOrganic: isOrganic || false,
    city: city || farmerProfile.city,
    isAvailable: quantity > 0
  });

  const createdProduct = await product.save();
  res.status(201).json({ success: true, data: createdProduct });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Farmer
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, description, price, quantity, unit, images, harvestDate, expiryDate, isOrganic, isAvailable } = req.body;

  const product = await Product.findById(req.params.id).populate('farmerId');
  const farmerProfile = await FarmerProfile.findOne({ userId: req.user._id });

  if (product) {
    const ownerUserId = product.farmerId?.userId ? product.farmerId.userId.toString() : product.farmerId?.toString();
    if (req.user.role !== 'admin' && ownerUserId !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this product');
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.quantity = quantity !== undefined ? quantity : product.quantity;
    product.unit = unit || product.unit;
    product.images = images || product.images;
    product.harvestDate = harvestDate || product.harvestDate;
    product.expiryDate = expiryDate || product.expiryDate;
    product.isOrganic = isOrganic !== undefined ? isOrganic : product.isOrganic;
    product.isAvailable = quantity > 0 ? (isAvailable !== undefined ? isAvailable : product.isAvailable) : false;

    const updatedProduct = await product.save();
    res.json({ success: true, data: updatedProduct });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Farmer/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('farmerId');

  if (product) {
    const ownerUserId = product.farmerId?.userId ? product.farmerId.userId.toString() : product.farmerId?.toString();
    if (req.user.role !== 'admin' && ownerUserId !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this product');
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ success: true, message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
