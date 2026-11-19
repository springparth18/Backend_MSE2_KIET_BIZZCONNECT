const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  groupOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
    required: true,
  },
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pricePerUnit: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  moq: { type: Number, required: true, min: 1 },
  deliveryDays: { type: Number, required: true, min: 1 },
  deliveryTerms: { type: String, trim: true },
  // Pricing slabs offered in this bid
  pricingSlabs: [{
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    pricePerUnit: { type: Number, required: true },
  }],
  notes: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// A wholesaler can only bid once per group order
bidSchema.index({ groupOrder: 1, wholesaler: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
