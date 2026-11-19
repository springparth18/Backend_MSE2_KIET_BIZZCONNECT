const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);
router.get('/profile', (req, res) => res.json({ success: true, data: req.user }));
router.patch('/profile', asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'storeName', 'storeAddress', 'neighbourhood', 'city', 'businessName', 'businessAddress', 'gstin'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
  res.json({ success: true, data: user });
}));
router.get('/', authorize('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json({ success: true, count: users.length, data: users });
}));

module.exports = router;
