const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const FarmerProfile = require('./src/models/FarmerProfile');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Review = require('./src/models/Review');
const connectDB = require('./src/config/db');

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // Clear all collections
    await Review.deleteMany();
    await Order.deleteMany();
    await User.deleteMany();
    await FarmerProfile.deleteMany();
    await Product.deleteMany();

    const salt = await bcrypt.genSalt(10);

    // ─── 1. Admin ─────────────────────────────────────────────────────────────
    await User.create({
      name: 'Super Admin',
      email: 'admin@farmdirect.com',
      password: await bcrypt.hash('Admin@123', salt),
      phone: '9999999999',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    // ─── 2. One Farmer (Ramesh Kumar - Ramesh Green Farms) ────────────────────
    const farmerUser = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh@farmer.com',
      password: await bcrypt.hash('Farmer@123', salt),
      phone: '9876543210',
      role: 'farmer',
      isVerified: true,
      city: 'Ahmedabad',
      state: 'Gujarat',
    });

    await FarmerProfile.create({
      userId: farmerUser._id,
      farmName: 'Ramesh Green Farms',
      ownerName: 'Ramesh Kumar',
      farmAddress: 'Village Sanand, Ahmedabad District',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382110',
      farmDescription: 'Dedicated to sustainable, regenerative agriculture and direct community supplies.',
      verificationStatus: 'approved',
      rating: 4.9,
    });

    console.log('Seeding Completed Successfully!');
    console.log('  1 Admin (admin@farmdirect.com)');
    console.log('  1 Farmer (ramesh@farmer.com)');
    console.log('  All products, orders, and reviews are now created directly via the live app.');
    process.exit();
  } catch (error) {
    console.error('Error: ' + error.message);
    process.exit(1);
  }
};

importData();
