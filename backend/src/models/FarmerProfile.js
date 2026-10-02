const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmName: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    farmAddress: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    pincode: {
      type: String,
      default: '',
    },
    farmDescription: String,
    governmentId: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
