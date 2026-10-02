const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  unit: { type: String },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerProfile',
  },
});

const farmerOrderSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FarmerProfile',
    required: true,
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  farmerOrderStatus: {
    type: String,
    enum: ['Placed', 'Accepted', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed',
  },
  placedAt: { type: Date, default: Date.now },
  acceptedAt: Date,
  packedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmerProfile',
      required: false,
    },
    items: [orderItemSchema],
    farmerOrders: [farmerOrderSchema],
    deliveryAddress: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    receiverName: String,
    receiverPhone: String,
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'Net Banking', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentId: String,
    orderStatus: {
      type: String,
      enum: ['Placed', 'Accepted', 'Packed', 'Out For Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
    },
    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    placedAt: Date,
    acceptedAt: Date,
    packedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
