const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

router.use(protect);

router.get('/order/:orderId', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const ownsOrder = order.retailer.equals(req.user._id) || order.wholesaler.equals(req.user._id);
  if (req.user.role !== 'admin' && !ownsOrder) return res.status(403).json({ success: false, message: 'You cannot track this order' });
  const delivery = await Delivery.findOne({ order: order._id }).populate('order');
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery record not found' });
  res.json({ success: true, data: delivery });
}));

router.patch('/:id/update', authorize('wholesaler', 'admin'), asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id).populate('order');
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery record not found' });
  if (req.user.role !== 'admin' && !delivery.order.wholesaler.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This delivery belongs to another wholesaler' });

  const allowed = ['awaiting_shipment', 'in_transit_to_hub', 'at_hub', 'sorting', 'dispatched', 'out_for_delivery', 'delivered', 'failed'];
  if (req.body.status && !allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid delivery status' });
  if (req.body.status) delivery.status = req.body.status;
  if (req.body.hubReceived !== undefined) delivery.hubReceived = req.body.hubReceived;
  if (req.body.hubReceived) delivery.hubReceivedAt = new Date();
  if (req.body.qualityChecked !== undefined) delivery.qualityChecked = req.body.qualityChecked;
  if (req.body.qualityNotes) delivery.qualityNotes = req.body.qualityNotes;
  if (req.body.damagedItems !== undefined) delivery.damagedItems = req.body.damagedItems;
  if (req.body.shortageItems !== undefined) delivery.shortageItems = req.body.shortageItems;
  if (req.body.driverName) delivery.driverName = req.body.driverName;
  if (req.body.driverPhone) delivery.driverPhone = req.body.driverPhone;
  if (req.body.vehicleNumber) delivery.vehicleNumber = req.body.vehicleNumber;
  if (req.body.status === 'dispatched') delivery.dispatchedAt = new Date();
  if (req.body.status === 'delivered') delivery.deliveredAt = new Date();
  delivery.trackingUpdates.push({ status: delivery.status, location: req.body.location, message: req.body.message || `Delivery marked ${delivery.status}` });
  await delivery.save();

  const orderStatusMap = { at_hub: 'at_distribution_hub', dispatched: 'out_for_delivery', out_for_delivery: 'out_for_delivery', delivered: 'delivered' };
  if (orderStatusMap[delivery.status]) {
    delivery.order.status = orderStatusMap[delivery.status];
    if (delivery.status === 'delivered') delivery.order.actualDelivery = new Date();
    delivery.order.trackingUpdates.push({ status: delivery.order.status, message: req.body.message || `Delivery marked ${delivery.status}` });
    await delivery.order.save();
  }
  res.json({ success: true, data: delivery });
}));

module.exports = router;
