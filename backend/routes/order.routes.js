const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const GroupOrder = require('../models/GroupOrder');
const Delivery = require('../models/Delivery');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : req.user.role === 'retailer' ? { retailer: req.user._id } : { wholesaler: req.user._id };
  const orders = await Order.find(filter).populate('retailer wholesaler groupOrder items.product').sort('-createdAt');
  res.json({ success: true, count: orders.length, data: orders });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('retailer wholesaler groupOrder items.product paymentId');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const ownsOrder = order.retailer._id.equals(req.user._id) || order.wholesaler._id.equals(req.user._id);
  if (req.user.role !== 'admin' && !ownsOrder) return res.status(403).json({ success: false, message: 'You cannot view this order' });
  res.json({ success: true, data: order });
}));

router.post('/from-group/:groupId', authorize('retailer', 'admin'), asyncHandler(async (req, res) => {
  const group = await GroupOrder.findById(req.params.groupId).populate('product selectedSupplier');
  if (!group) return res.status(404).json({ success: false, message: 'Group order not found' });
  if (!['supplier_selected', 'confirmed', 'checkout'].includes(group.status)) return res.status(400).json({ success: false, message: 'This group is not ready for checkout' });

  const participant = group.participants.find((entry) => entry.retailer.equals(req.user._id));
  if (!participant && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'You have not joined this group order' });

  const quantity = participant ? participant.quantity : req.body.quantity;
  if (!quantity) return res.status(400).json({ success: false, message: 'Quantity is required' });
  const price = group.finalPricePerUnit || group.estimatedPricePerUnit;
  const subtotal = quantity * price;
  const deliveryCharge = subtotal >= 5000 ? 0 : 150;

  const order = await Order.create({
    retailer: req.user._id,
    wholesaler: group.selectedSupplier,
    groupOrder: group._id,
    items: [{ product: group.product._id, quantity, pricePerUnit: price, totalPrice: subtotal }],
    subtotal,
    deliveryCharge,
    totalAmount: subtotal + deliveryCharge,
    deliveryAddress: req.body.deliveryAddress || req.user.storeAddress,
  });
  await Delivery.create({ order: order._id, status: 'awaiting_shipment', trackingUpdates: [{ status: 'awaiting_shipment', message: 'Order created and awaiting supplier shipment' }] });
  group.status = 'checkout';
  await group.save();

  res.status(201).json({ success: true, data: order });
}));

router.patch('/:id/status', authorize('wholesaler', 'admin'), asyncHandler(async (req, res) => {
  const allowed = ['pending', 'confirmed', 'processing', 'at_distribution_hub', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid order status' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (req.user.role !== 'admin' && !order.wholesaler.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This order belongs to another wholesaler' });
  order.status = req.body.status;
  if (req.body.status === 'delivered') order.actualDelivery = new Date();
  order.trackingUpdates.push({ status: req.body.status, message: req.body.message || `Order marked ${req.body.status}` });
  await order.save();
  res.json({ success: true, data: order });
}));

module.exports = router;
