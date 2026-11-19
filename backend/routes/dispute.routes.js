const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const Dispute = require('../models/Dispute');
const Order = require('../models/Order');

router.use(protect);

router.post('/', [
  body('order').isMongoId(),
  body('type').isIn(['shortage', 'damaged_goods', 'wrong_item', 'quality_issue', 'delivery_delay', 'payment_issue', 'other']),
  body('description').trim().notEmpty(),
], validate, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.order);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const ownsOrder = order.retailer.equals(req.user._id) || order.wholesaler.equals(req.user._id);
  if (req.user.role !== 'admin' && !ownsOrder) return res.status(403).json({ success: false, message: 'You cannot dispute this order' });
  const dispute = await Dispute.create({
    order: order._id,
    raisedBy: req.user._id,
    againstUser: req.user._id.equals(order.retailer) ? order.wholesaler : order.retailer,
    type: req.body.type,
    description: req.body.description,
    evidence: req.body.evidence || [],
  });
  res.status(201).json({ success: true, data: dispute });
}));

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { $or: [{ raisedBy: req.user._id }, { againstUser: req.user._id }] };
  const disputes = await Dispute.find(filter).populate('order raisedBy againstUser resolvedBy').sort('-createdAt');
  res.json({ success: true, count: disputes.length, data: disputes });
}));

router.patch('/:id/resolve', authorize('admin'), [
  body('resolution').trim().notEmpty(), body('refundAmount').optional().isFloat({ min: 0 }),
], validate, asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
  dispute.status = 'resolved';
  dispute.resolution = req.body.resolution;
  dispute.refundAmount = Number(req.body.refundAmount || 0);
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();
  res.json({ success: true, data: dispute });
}));

module.exports = router;
