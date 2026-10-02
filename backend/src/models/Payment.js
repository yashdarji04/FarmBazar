const mongoose = require('mongoose');

// A dedicated Payments collection, separate from (but linked to) Orders,
// so payment records can be listed/audited on their own — mirrors the
// order's payment fields at the time of each change.
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'Net Banking', 'COD'],
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    transactionRef: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
