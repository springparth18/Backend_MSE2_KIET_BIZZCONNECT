const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: { type: String, trim: true },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'box', 'dozen'],
    default: 'kg',
  },
  image: { type: String, default: '' },
  // Wholesaler who listed this product
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Pricing
  retailPrice: { type: Number, required: true, min: 0 },
  wholesalePrice: { type: Number, required: true, min: 0 },
  moq: { type: Number, required: true, min: 1 },  // Minimum Order Quantity
  // Pricing slabs
  pricingSlabs: [{
    minQuantity: { type: Number, required: true },
    maxQuantity: { type: Number },
    pricePerUnit: { type: Number, required: true },
  }],
  // Stock & availability
  stockQuantity: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true },
  // Delivery info
  deliveryDays: { type: Number, default: 3 },
  deliveryTerms: { type: String, trim: true },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
