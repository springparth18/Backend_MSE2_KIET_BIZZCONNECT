const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');

router.get('/', asyncHandler(async (req, res) => {
  const filter = { isAvailable: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: req.query.search };
  const products = await Product.find(filter).populate('wholesaler', 'name businessName reliabilityScore isVerified').sort('-createdAt');
  res.json({ success: true, count: products.length, data: products });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('wholesaler', 'name businessName reliabilityScore isVerified');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
}));

router.post('/', protect, authorize('wholesaler', 'admin'), [
  body('name').trim().notEmpty(), body('category').trim().notEmpty(),
  body('retailPrice').isFloat({ min: 0 }), body('wholesalePrice').isFloat({ min: 0 }),
  body('moq').isFloat({ min: 1 }), body('stockQuantity').optional().isFloat({ min: 0 }),
], validate, asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, wholesaler: req.user._id });
  res.status(201).json({ success: true, data: product });
}));

router.patch('/:id', protect, authorize('wholesaler', 'admin'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (req.user.role !== 'admin' && !product.wholesaler.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This product belongs to another wholesaler' });
  Object.assign(product, req.body);
  await product.save();
  res.json({ success: true, data: product });
}));

router.delete('/:id', protect, authorize('wholesaler', 'admin'), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (req.user.role !== 'admin' && !product.wholesaler.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This product belongs to another wholesaler' });
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
}));

module.exports = router;
