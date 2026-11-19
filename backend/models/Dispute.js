const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  againstUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: ['shortage', 'damaged_goods', 'wrong_item', 'quality_issue', 'delivery_delay', 'payment_issue', 'other'],
    required: true,
  },
  description: { type: String, required: true, trim: true },
  evidence: [{ type: String }],  // URLs or file paths
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'escalated', 'closed'],
    default: 'open',
  },
  resolution: { type: String, trim: true },
  refundAmount: { type: Number, default: 0 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
