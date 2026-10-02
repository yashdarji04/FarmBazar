const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'new_order',
        'order_status',
        'new_review',
        'new_contact',
        'farmer_registration',
        'farmer_approved',
        'farmer_rejected',
        'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String, default: 'bell' }, // lucide icon name
    color: { type: String, default: 'blue' }, // theme color
    link: { type: String, default: '' }, // optional navigation link
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // orderId, reviewId, etc.
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
