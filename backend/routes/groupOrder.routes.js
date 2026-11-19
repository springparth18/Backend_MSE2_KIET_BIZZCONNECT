const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const GroupOrder = require('../models/GroupOrder');
const Product = require('../models/Product');

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.neighbourhood) filter.neighbourhood = req.query.neighbourhood;
  const groups = await GroupOrder.find(filter).populate('product initiator selectedSupplier', 'name title category storeName businessName').sort('-createdAt');
  res.json({ success: true, count: groups.length, data: groups });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const group = await GroupOrder.findById(req.params.id).populate('product initiator participants.retailer selectedSupplier selectedBid');
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  res.json({ success: true, data: group });
}));

router.post('/', protect, authorize('retailer', 'admin'), [
  body('product').isMongoId(), body('title').trim().notEmpty(),
  body('targetQuantity').isFloat({ min: 1 }), body('deadline').isISO8601(),
], validate, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.product);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (new Date(req.body.deadline) <= new Date()) return res.status(400).json({ success: false, message: 'Deadline must be in the future' });

  const group = await GroupOrder.create({
    ...req.body,
    initiator: req.user._id,
    neighbourhood: req.body.neighbourhood || req.user.neighbourhood,
    unit: req.body.unit || product.unit,
    estimatedPricePerUnit: req.body.estimatedPricePerUnit || product.wholesalePrice,
  });
  res.status(201).json({ success: true, data: group });
}));

router.post('/:id/join', protect, authorize('retailer', 'admin'), [body('quantity').isFloat({ min: 1 })], validate, asyncHandler(async (req, res) => {
  const group = await GroupOrder.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  if (!['open', 'threshold_reached'].includes(group.status)) return res.status(400).json({ success: false, message: 'This group order is no longer accepting participants' });
  if (new Date(group.deadline) <= new Date()) return res.status(400).json({ success: false, message: 'The joining deadline has passed' });

  const existing = group.participants.find((participant) => participant.retailer.equals(req.user._id));
  if (existing) {
    existing.quantity += Number(req.body.quantity);
  } else {
    group.participants.push({ retailer: req.user._id, quantity: Number(req.body.quantity) });
  }
  group.currentQuantity = group.participants.reduce((sum, participant) => sum + participant.quantity, 0);
  if (group.currentQuantity >= group.targetQuantity && group.status === 'open') group.status = 'threshold_reached';
  await group.save();
  res.json({ success: true, data: group });
}));

router.post('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const group = await GroupOrder.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  if (req.user.role !== 'admin' && !group.initiator.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Only the initiator or an admin can cancel this group' });
  if (['fulfilled', 'cancelled', 'closed'].includes(group.status)) return res.status(400).json({ success: false, message: `Cannot cancel a ${group.status} group` });
  group.status = 'cancelled';
  await group.save();
  res.json({ success: true, data: group });
}));

module.exports = router;
