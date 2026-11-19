const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true, min: 1 },
  joinedAt: { type: Date, default: Date.now },
});

const groupOrderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  // The retailer who initiated the group order
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  neighbourhood: { type: String, trim: true },
  // Quantity tracking
  targetQuantity: { type: Number, required: true, min: 1 },
  currentQuantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'kg' },
  // Participants
  participants: [participantSchema],
  // Pricing
  estimatedPricePerUnit: { type: Number },
  finalPricePerUnit: { type: Number },
  // Status lifecycle
  status: {
    type: String,
    enum: ['open', 'threshold_reached', 'bidding', 'supplier_selected', 'confirmed', 'checkout', 'fulfilled', 'closed', 'cancelled'],
    default: 'open',
  },
  // Timeline
  deadline: { type: Date, required: true },
  // Selected supplier (after bidding)
  selectedBid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  selectedSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual: progress percentage
groupOrderSchema.virtual('progress').get(function () {
  if (!this.targetQuantity) return 0;
  return Math.min(100, Math.round((this.currentQuantity / this.targetQuantity) * 100));
});

groupOrderSchema.set('toJSON', { virtuals: true });
groupOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
