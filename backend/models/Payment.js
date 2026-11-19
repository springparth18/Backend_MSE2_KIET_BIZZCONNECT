const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: { type: Number, required: true, min: 0 },
  method: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
    default: 'upi',
  },
  transactionId: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paidAt: { type: Date },
  refundedAt: { type: Date },
  refundAmount: { type: Number, default: 0 },
  failureReason: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
