const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name price images unit farmerId');
  
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  } else {
    // Filter out any orphaned items if the product was deleted
    const initialCount = cart.items.length;
    cart.items = cart.items.filter((item) => item.product !== null);
    if (cart.items.length !== initialCount) {
      cart.calculateTotal();
      await cart.save();
    }
  }
  
  res.status(200).json({ success: true, data: cart });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.isAvailable === false || product.quantity <= 0) {
    res.status(400);
    throw new Error('This produce is currently out of stock');
  }

  if (quantity > product.quantity) {
    res.status(400);
    throw new Error(`Only ${product.quantity} ${product.unit || 'unit'}(s) available in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

  if (itemIndex > -1) {
    const totalQty = cart.items[itemIndex].quantity + quantity;
    if (totalQty > product.quantity) {
      res.status(400);
      throw new Error(`Cannot add more. Only ${product.quantity} ${product.unit || 'unit'}(s) available in stock`);
    }
    cart.items[itemIndex].quantity = totalQty;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  cart.calculateTotal();
  await cart.save();

  await cart.populate('items.product', 'name price images unit farmerId');
  res.status(200).json({ success: true, data: cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId);
  if (product && quantity > product.quantity) {
    res.status(400);
    throw new Error(`Only ${product.quantity} ${product.unit || 'unit'}(s) available in stock`);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  } else {
    res.status(404);
    throw new Error('Item not found in cart');
  }

  cart.calculateTotal();
  await cart.save();

  await cart.populate('items.product', 'name price images unit farmerId');
  res.status(200).json({ success: true, data: cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);

  cart.calculateTotal();
  await cart.save();

  await cart.populate('items.product', 'name price images unit farmerId');
  res.status(200).json({ success: true, data: cart });
});

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
  }

  res.status(200).json({ success: true, message: 'Cart cleared' });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
