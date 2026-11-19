const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');

router.use(protect);

router.post('/process', [
  body('order').isMongoId(), body('method').optional().isIn(['upi', 'card', 'netbanking', 'wallet', 'cod']),
], validate, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.body.order);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (!order.retailer.equals(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'This payment belongs to another retailer' });
  if (order.paymentStatus === 'completed') return res.status(400).json({ success: false, message: 'Payment has already been completed' });

  const successful = req.body.simulateFailure !== true;
  const payment = await Payment.create({
    order: order._id, retailer: req.user._id, amount: order.totalAmount,
    method: req.body.method || 'upi', status: successful ? 'completed' : 'failed',
    transactionId: successful ? `TXN-${Date.now()}-${order.orderNumber}` : undefined,
    paidAt: successful ? new Date() : undefined,
    failureReason: successful ? undefined : 'Simulated payment failure',
  });

  order.paymentStatus = successful ? 'completed' : 'failed';
  order.paymentId = payment._id;
  if (successful) {
    order.status = 'confirmed';
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalOrders: 1 } });
  }
  await order.save();
  res.status(successful ? 201 : 402).json({ success: successful, data: payment, message: successful ? 'Payment completed' : 'Payment failed' });
}));

router.post('/:id/refund', asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  if (req.user.role !== 'admin' && !payment.retailer.equals(req.user._id)) return res.status(403).json({ success: false, message: 'This payment belongs to another retailer' });
  payment.status = 'refunded';
  payment.refundedAt = new Date();
  payment.refundAmount = Number(req.body.amount || payment.amount);
  await payment.save();
  await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'refunded' });
  res.json({ success: true, data: payment });
}));

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { retailer: req.user._id };
  const payments = await Payment.find(filter)
    .populate({ path: 'order', populate: [{ path: 'retailer', select: 'name email storeName storeAddress' }, { path: 'wholesaler', select: 'name businessName businessAddress' }, { path: 'items.product', select: 'name unit retailPrice' }] })
    .sort('-createdAt');
  res.json({ success: true, count: payments.length, data: payments });
}));

module.exports = router;
