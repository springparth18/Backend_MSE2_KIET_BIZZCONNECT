require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const seed = async () => {
  await connectDB();

  const users = [
    { name: 'Admin User', email: 'admin@bizzconnect.local', password: 'Admin123!', role: 'admin', isVerified: true },
    { name: 'Asha Sharma', email: 'retailer@bizzconnect.local', password: 'Retailer123!', role: 'retailer', storeName: 'Sharma General Store', storeAddress: '12 Indiranagar', neighbourhood: 'Indiranagar', city: 'Bengaluru' },
    { name: 'Rajesh Kumar', email: 'wholesaler@bizzconnect.local', password: 'Wholesaler123!', role: 'wholesaler', businessName: 'Metro Cash & Carry', businessAddress: 'Central Bengaluru', isVerified: true, reliabilityScore: 92 },
  ];

  const savedUsers = {};
  for (const data of users) {
    const existing = await User.findOne({ email: data.email });
    savedUsers[data.role] = existing || await User.create(data);
  }

  if (!(await Product.findOne({ name: 'Sona Masoori Rice' }))) {
    await Product.create({
      name: 'Sona Masoori Rice', description: 'Premium raw rice', category: 'Rice & Grains', unit: 'kg',
      wholesaler: savedUsers.wholesaler._id, retailPrice: 56, wholesalePrice: 48, moq: 100,
      stockQuantity: 5000, pricingSlabs: [{ minQuantity: 100, maxQuantity: 499, pricePerUnit: 48 }, { minQuantity: 500, pricePerUnit: 44 }],
      deliveryDays: 3, deliveryTerms: 'Hub delivery included',
    });
  }

  console.log('Seed complete');
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
