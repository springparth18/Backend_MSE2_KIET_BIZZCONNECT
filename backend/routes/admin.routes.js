const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const GroupOrder = require('../models/GroupOrder');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

router.use(protect, authorize('admin'));

router.get('/overview', asyncHandler(async (req, res) => {
  const [users, groupOrders, orders, payments] = await Promise.all([
    User.countDocuments(), GroupOrder.countDocuments(), Order.countDocuments(), Payment.countDocuments(),
  ]);
  res.json({ success: true, data: { users, groupOrders, orders, payments } });
}));

router.patch('/suppliers/:id/verify', asyncHandler(async (req, res) => {
  const supplier = await User.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'User not found' });
  if (supplier.role !== 'wholesaler') return res.status(400).json({ success: false, message: 'Only wholesaler accounts can be verified' });
  supplier.isVerified = req.body.verified !== false;
  await supplier.save();
  res.json({ success: true, data: await User.findById(supplier._id).select('-password') });
}));

router.patch('/group-orders/:id/status', asyncHandler(async (req, res) => {
  const allowed = ['open', 'threshold_reached', 'bidding', 'supplier_selected', 'confirmed', 'checkout', 'fulfilled', 'closed', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid group order status' });
  const group = await GroupOrder.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  res.json({ success: true, data: group });
}));

module.exports = router;
