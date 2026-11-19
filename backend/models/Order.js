const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  groupOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupOrder',
  },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  // Status lifecycle
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing',
      'at_distribution_hub', 'out_for_delivery',
      'delivered', 'cancelled', 'returned',
    ],
    default: 'pending',
  },
  // Delivery info
  deliveryAddress: { type: String },
  estimatedDelivery: { type: Date },
  actualDelivery: { type: Date },
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  // Tracking
  trackingUpdates: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
  }],
  notes: { type: String, trim: true },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `BC-${String(24000 + count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
