const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const GroupOrder = require('../models/GroupOrder');

router.use(protect);

router.get('/dashboard', asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const orderFilter = isAdmin ? {} : req.user.role === 'retailer' ? { retailer: req.user._id } : { wholesaler: req.user._id };
  const [orders, activeGroups, payments] = await Promise.all([
    Order.find(orderFilter),
    GroupOrder.countDocuments(isAdmin ? { status: { $nin: ['closed', 'cancelled', 'fulfilled'] } } : { 'participants.retailer': req.user._id, status: { $nin: ['closed', 'cancelled', 'fulfilled'] } }),
    Payment.find(isAdmin ? { status: 'completed' } : { retailer: req.user._id, status: 'completed' }),
  ]);

  const savings = req.user.totalSavings || payments.reduce((sum, payment) => sum + payment.amount * 0.08, 0);
  res.json({
    success: true,
    data: {
      totalOrders: orders.length,
      activeGroups,
      completedOrders: orders.filter((order) => order.status === 'delivered').length,
      inTransit: orders.filter((order) => ['at_distribution_hub', 'out_for_delivery'].includes(order.status)).length,
      savings,
      retailerPowerIndex: req.user.powerIndex,
      reliabilityScore: req.user.reliabilityScore,
    },
  });
}));

module.exports = router;
