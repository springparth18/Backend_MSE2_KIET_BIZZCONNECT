require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const GroupOrder = require('../models/GroupOrder');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');

const ensureDemoOrder = async ({ retailer, wholesaler, product, notes, quantity, pricePerUnit, status, paymentStatus, deliveryStatus }) => {
  let order = await Order.findOne({ retailer: retailer._id, notes });
  if (!order) {
    const subtotal = quantity * pricePerUnit;
    const deliveryCharge = subtotal >= 5000 ? 0 : 150;
    order = await Order.create({
      retailer: retailer._id,
      wholesaler: wholesaler._id,
      items: [{ product: product._id, quantity, pricePerUnit, totalPrice: subtotal }],
      subtotal,
      deliveryCharge,
      totalAmount: subtotal + deliveryCharge,
      status,
      paymentStatus,
      deliveryAddress: retailer.storeAddress,
      actualDelivery: status === 'delivered' ? new Date() : undefined,
      notes,
      trackingUpdates: [{ status, message: `Seeded demo order ${status.replaceAll('_', ' ')}` }],
    });
  }

  let payment = await Payment.findOne({ order: order._id, status: paymentStatus });
  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      retailer: retailer._id,
      amount: order.totalAmount,
      method: 'upi',
      transactionId: paymentStatus === 'completed' ? `DEMO-${order.orderNumber}` : undefined,
      status: paymentStatus,
      paidAt: paymentStatus === 'completed' ? order.createdAt : undefined,
      failureReason: paymentStatus === 'failed' ? 'Seeded demo payment failure' : undefined,
    });
  }
  if (!order.paymentId) {
    order.paymentId = payment._id;
    await order.save();
  }

  if (!(await Delivery.exists({ order: order._id }))) {
    await Delivery.create({
      order: order._id,
      status: deliveryStatus,
      hubReceived: ['at_hub', 'sorting', 'dispatched', 'out_for_delivery', 'delivered'].includes(deliveryStatus),
      qualityChecked: ['sorting', 'dispatched', 'out_for_delivery', 'delivered'].includes(deliveryStatus),
      dispatchedAt: ['dispatched', 'out_for_delivery', 'delivered'].includes(deliveryStatus) ? new Date() : undefined,
      deliveredAt: deliveryStatus === 'delivered' ? new Date() : undefined,
      trackingUpdates: [{ status: deliveryStatus, location: retailer.neighbourhood || 'Local hub', message: `Seeded demo delivery ${deliveryStatus.replaceAll('_', ' ')}` }],
    });
  }
};

const seed = async (shouldDisconnect = true) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  const users = [
    { name: 'Admin User', email: 'admin@bizzconnect.local', password: 'Admin123!', role: 'admin', isVerified: true },
    { name: 'Asha Sharma', email: 'retailer@bizzconnect.local', password: 'Retailer123!', role: 'retailer', storeName: 'Sharma General Store', storeAddress: '12 Indiranagar', neighbourhood: 'Indiranagar', city: 'Bengaluru' },
    { name: 'Priya Market', email: 'neighbour@bizzconnect.local', password: 'Neighbour123!', role: 'retailer', storeName: 'Priya Daily Needs', storeAddress: '8 Indiranagar', neighbourhood: 'Indiranagar', city: 'Bengaluru' },
    { name: 'Rajesh Kumar', email: 'wholesaler@bizzconnect.local', password: 'Wholesaler123!', role: 'wholesaler', businessName: 'Metro Cash & Carry', businessAddress: 'Central Bengaluru', isVerified: true, reliabilityScore: 92 },
  ];

  const savedUsers = {};
  for (const data of users) {
    const existing = await User.findOne({ email: data.email });
    const key = data.email === 'neighbour@bizzconnect.local' ? 'neighbour' : data.role;
    savedUsers[key] = existing || await User.create(data);
  }

  const savingsHistory = [620, 740, 690, 880, 960, 1120].map((amount, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 5 + index);
    return { month: date.toLocaleDateString('en-IN', { month: 'short' }), amount };
  });
  for (const retailer of [savedUsers.retailer, savedUsers.neighbour]) {
    await User.updateOne({ _id: retailer._id }, {
      $set: { savingsHistory, totalSavings: savingsHistory.reduce((total, entry) => total + entry.amount, 0), powerIndex: 68 },
    });
  }

  const productCatalog = [
    { name: 'Sona Masoori Rice', description: 'Premium raw rice', category: 'Rice & Grains', unit: 'kg', retailPrice: 56, wholesalePrice: 48, moq: 100, stockQuantity: 5000, deliveryDays: 3 },
    { name: 'Toor Dal', description: 'Cleaned and graded arhar dal', category: 'Pulses', unit: 'kg', retailPrice: 92, wholesalePrice: 78, moq: 50, stockQuantity: 1800, deliveryDays: 2 },
    { name: 'Sunflower Oil', description: 'Refined sunflower cooking oil', category: 'Cooking Oils', unit: 'litre', retailPrice: 132, wholesalePrice: 116, moq: 60, stockQuantity: 1200, deliveryDays: 2 },
  ];

  const products = {};
  for (const data of productCatalog) {
    let product = await Product.findOne({ name: data.name, wholesaler: savedUsers.wholesaler._id });
    if (!product) {
      product = await Product.create({ ...data, wholesaler: savedUsers.wholesaler._id, deliveryTerms: 'Delivery to BizzConnect distribution hub' });
    }
    products[data.name] = product;
  }

  const openGroupTitle = 'Neighbourhood sunflower oil order';
  if (!(await GroupOrder.exists({ title: openGroupTitle }))) {
    await GroupOrder.create({
      product: products['Sunflower Oil']._id,
      initiator: savedUsers.retailer._id,
      title: openGroupTitle,
      description: 'Indiranagar retailers pooling their weekly oil purchase',
      neighbourhood: 'Indiranagar',
      targetQuantity: 500,
      currentQuantity: 100,
      unit: 'litre',
      participants: [{ retailer: savedUsers.retailer._id, quantity: 40 }, { retailer: savedUsers.neighbour._id, quantity: 60 }],
      estimatedPricePerUnit: 116,
      status: 'open',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
  }

  const biddingTitle = 'Weekly Toor Dal collective';
  let biddingGroup = await GroupOrder.findOne({ title: biddingTitle });
  if (!biddingGroup) {
    biddingGroup = await GroupOrder.create({
      product: products['Toor Dal']._id,
      initiator: savedUsers.retailer._id,
      title: biddingTitle,
      description: 'Verified demand from nearby grocery retailers',
      neighbourhood: 'Indiranagar',
      targetQuantity: 300,
      currentQuantity: 300,
      unit: 'kg',
      participants: [{ retailer: savedUsers.retailer._id, quantity: 180 }, { retailer: savedUsers.neighbour._id, quantity: 120 }],
      estimatedPricePerUnit: 78,
      status: 'bidding',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
  }
  if (!(await Bid.exists({ groupOrder: biddingGroup._id, wholesaler: savedUsers.wholesaler._id }))) {
    await Bid.create({
      groupOrder: biddingGroup._id, wholesaler: savedUsers.wholesaler._id,
      pricePerUnit: 75, totalPrice: 22500, moq: 100, deliveryDays: 2,
      deliveryTerms: 'Delivery to BizzConnect distribution hub',
      notes: 'Seeded sample bid for supplier comparison',
    });
  }

  for (const retailer of [savedUsers.retailer, savedUsers.neighbour]) {
    let sampleOrder = await Order.findOne({ retailer: retailer._id, notes: 'seed:historical-order' });
    if (!sampleOrder) {
      const quantity = 25;
      const pricePerUnit = products['Toor Dal'].wholesalePrice;
      const subtotal = quantity * pricePerUnit;
      sampleOrder = await Order.create({
        retailer: retailer._id,
        wholesaler: savedUsers.wholesaler._id,
        items: [{ product: products['Toor Dal']._id, quantity, pricePerUnit, totalPrice: subtotal }],
        subtotal,
        deliveryCharge: 0,
        totalAmount: subtotal,
        status: 'delivered',
        paymentStatus: 'completed',
        deliveryAddress: retailer.storeAddress,
        actualDelivery: new Date(),
        notes: 'seed:historical-order',
        trackingUpdates: [{ status: 'delivered', message: 'Seeded sample order delivered' }],
      });
    }

    let samplePayment = await Payment.findOne({ order: sampleOrder._id, status: 'completed' });
    if (!samplePayment) {
      samplePayment = await Payment.create({
        order: sampleOrder._id,
        retailer: retailer._id,
        amount: sampleOrder.totalAmount,
        method: 'upi',
        transactionId: `DEMO-${sampleOrder.orderNumber}`,
        status: 'completed',
        paidAt: new Date(),
      });
    }
    if (!sampleOrder.paymentId) {
      sampleOrder.paymentId = samplePayment._id;
      await sampleOrder.save();
    }
    if (!(await Delivery.exists({ order: sampleOrder._id }))) {
      await Delivery.create({
        order: sampleOrder._id,
        status: 'delivered',
        hubReceived: true,
        hubReceivedAt: new Date(),
        qualityChecked: true,
        sortedAt: new Date(),
        dispatchedAt: new Date(),
        deliveredAt: new Date(),
        trackingUpdates: [{ status: 'delivered', location: retailer.neighbourhood || 'Local hub', message: 'Seeded sample delivery completed' }],
      });
    }

    await ensureDemoOrder({
      retailer,
      wholesaler: savedUsers.wholesaler,
      product: products['Sunflower Oil'],
      notes: 'seed:in-transit-order',
      quantity: 12,
      pricePerUnit: products['Sunflower Oil'].wholesalePrice,
      status: 'out_for_delivery',
      paymentStatus: 'completed',
      deliveryStatus: 'out_for_delivery',
    });
    await ensureDemoOrder({
      retailer,
      wholesaler: savedUsers.wholesaler,
      product: products['Sona Masoori Rice'],
      notes: 'seed:failed-payment-order',
      quantity: 10,
      pricePerUnit: products['Sona Masoori Rice'].wholesalePrice,
      status: 'pending',
      paymentStatus: 'failed',
      deliveryStatus: 'awaiting_shipment',
    });
    const totalOrders = await Order.countDocuments({ retailer: retailer._id });
    await User.updateOne({ _id: retailer._id }, { $set: { totalOrders } });
  }

  console.log('Seed complete');
  if (shouldDisconnect) {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seed(true).catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = { seed };
