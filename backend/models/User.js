const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['retailer', 'wholesaler', 'admin'],
    default: 'retailer',
  },
  phone: { type: String, trim: true },
  // Retailer-specific
  storeName: { type: String, trim: true },
  storeAddress: { type: String, trim: true },
  neighbourhood: { type: String, trim: true },
  city: { type: String, trim: true },
  // Wholesaler-specific
  businessName: { type: String, trim: true },
  businessAddress: { type: String, trim: true },
  gstin: { type: String, trim: true },
  isVerified: { type: Boolean, default: false },
  // Metrics
  powerIndex: { type: Number, default: 50, min: 0, max: 100 },
  reliabilityScore: { type: Number, default: 50, min: 0, max: 100 },
  totalOrders: { type: Number, default: 0 },
  totalSavings: { type: Number, default: 0 },
  savingsHistory: [{
    month: { type: String, required: true },
    amount: { type: Number, min: 0, default: 0 },
  }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
