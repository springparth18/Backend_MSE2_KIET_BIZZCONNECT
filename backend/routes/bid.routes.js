const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const Bid = require('../models/Bid');
const GroupOrder = require('../models/GroupOrder');

router.get('/group/:groupId', protect, asyncHandler(async (req, res) => {
  const bids = await Bid.find({ groupOrder: req.params.groupId }).populate('wholesaler', 'name businessName reliabilityScore isVerified').sort('pricePerUnit');
  res.json({ success: true, count: bids.length, data: bids });
}));

router.post('/', protect, authorize('wholesaler'), [
  body('groupOrder').isMongoId(), body('pricePerUnit').isFloat({ min: 0 }),
  body('totalPrice').isFloat({ min: 0 }), body('moq').isFloat({ min: 1 }),
  body('deliveryDays').isInt({ min: 1 }),
], validate, asyncHandler(async (req, res) => {
  const group = await GroupOrder.findById(req.body.groupOrder);
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  if (!['threshold_reached', 'bidding'].includes(group.status)) return res.status(400).json({ success: false, message: 'Bidding is not open for this group order' });
  if (!req.user.isVerified) return res.status(403).json({ success: false, message: 'Your wholesaler account is awaiting verification' });

  const bid = await Bid.create({ ...req.body, wholesaler: req.user._id });
  if (group.status === 'threshold_reached') {
    group.status = 'bidding';
    await group.save();
  }
  res.status(201).json({ success: true, data: bid });
}));

router.post('/:id/accept', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
  await Bid.updateMany({ groupOrder: bid.groupOrder, _id: { $ne: bid._id } }, { status: 'rejected' });
  bid.status = 'accepted';
  await bid.save();

  await GroupOrder.findByIdAndUpdate(bid.groupOrder, {
    status: 'supplier_selected', selectedBid: bid._id,
    selectedSupplier: bid.wholesaler, finalPricePerUnit: bid.pricePerUnit,
  });
  res.json({ success: true, data: bid });
}));

router.post('/:id/withdraw', protect, authorize('wholesaler'), asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });
  if (!bid.wholesaler.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This bid belongs to another wholesaler' });
  if (bid.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bids can be withdrawn' });
  bid.status = 'withdrawn';
  await bid.save();
  res.json({ success: true, data: bid });
}));

module.exports = router;
