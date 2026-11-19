const router = require('express').Router();
const { body } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const signToken = require('../utils/token');
const User = require('../models/User');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['retailer', 'wholesaler', 'admin']).withMessage('Invalid role'),
  body('storeName').if(body('role').equals('retailer')).trim().notEmpty().withMessage('Store name is required for retailer accounts'),
  body('businessName').if(body('role').equals('wholesaler')).trim().notEmpty().withMessage('Business name is required for wholesaler accounts'),
];

router.post('/register', registerRules, validate, asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) return res.status(409).json({ success: false, message: 'Email is already registered' });

  const role = req.body.role || 'retailer';
  if (role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin accounts cannot be registered publicly' });
  }

  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: { token: signToken(user), user: await User.findById(user._id).select('-password') } });
}));

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  res.json({ success: true, data: { token: signToken(user), user: await User.findById(user._id).select('-password') } });
}));

router.get('/me', protect, (req, res) => res.json({ success: true, data: req.user }));
router.post('/logout', protect, (req, res) => res.json({ success: true, message: 'Logged out successfully' }));

module.exports = router;
