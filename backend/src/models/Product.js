const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmerProfile',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'gram', 'litre', 'piece', 'dozen'],
    },
    images: [String],
    harvestDate: Date,
    expiryDate: Date,
    isOrganic: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    city: String,
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', category: 'text', city: 'text' });

module.exports = mongoose.model('Product', productSchema);
