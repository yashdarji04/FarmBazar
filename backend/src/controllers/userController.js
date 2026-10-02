const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
const Product = require('../models/Product');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all approved farmers with their product categories (public)
// @route   GET /api/users/farmers
// @access  Public
const getAllFarmers = asyncHandler(async (req, res) => {
  const farmers = await FarmerProfile.find({ verificationStatus: 'approved' }).sort({ totalSales: -1 });

  // For each farmer, get the distinct categories of products they sell
  const farmersWithCategories = await Promise.all(
    farmers.map(async (farmer) => {
      const products = await Product.find({ farmerId: farmer._id, isAvailable: true })
        .select('category name price unit images')
        .lean();
      const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
      return {
        ...farmer.toObject(),
        categories,
        productCount: products.length,
        sampleProducts: products.slice(0, 3),
      };
    })
  );

  res.json({
    success: true,
    data: farmersWithCategories,
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  if (user) {
    let extraData = {};
    if (user.role === 'farmer') {
      const farmerProfile = await FarmerProfile.findOne({ userId: user._id });
      extraData = { farmerProfile };
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        ...extraData
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    user.name = req.body.name !== undefined ? req.body.name : user.name;
    user.email = req.body.email !== undefined ? req.body.email : user.email;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.address = req.body.address !== undefined ? req.body.address : user.address;
    user.city = req.body.city !== undefined ? req.body.city : user.city;
    user.state = req.body.state !== undefined ? req.body.state : user.state;
    user.pincode = req.body.pincode !== undefined ? req.body.pincode : user.pincode;
    
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    const updatedUser = await user.save();
    
    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await FarmerProfile.findOne({ userId: user._id });
      if (farmerProfile) {
        farmerProfile.farmName = req.body.farmName !== undefined ? req.body.farmName : farmerProfile.farmName;
        farmerProfile.farmDescription = req.body.farmDescription !== undefined ? req.body.farmDescription : farmerProfile.farmDescription;
        farmerProfile.farmImage = req.body.farmImage !== undefined ? req.body.farmImage : farmerProfile.farmImage;

        
        // Handle farmLocation parsing (City, State)
        if (req.body.farmLocation !== undefined) {
          if (req.body.farmLocation.trim() === '') {
            farmerProfile.city = '';
            farmerProfile.state = '';
          } else {
            const parts = req.body.farmLocation.split(',').map(p => p.trim());
            if (parts.length >= 2) {
              farmerProfile.city = parts[0];
              farmerProfile.state = parts[1];
            } else {
              farmerProfile.city = req.body.farmLocation.trim();
              farmerProfile.state = ''; // clear state if only city is provided
            }
          }
        }
        await farmerProfile.save();
      }
    }
    
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        role: updatedUser.role,
        farmerProfile,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get Admin Dashboard Data
// @route   GET /api/users/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  // Aggregate some simple stats for the admin dashboard
  const usersCount = await User.countDocuments();
  const farmersCount = await User.countDocuments({ role: 'farmer' });
  const customersCount = await User.countDocuments({ role: 'customer' });
  
  const orders = await Order.find({});
  const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  
  const pendingFarmers = await FarmerProfile.find({ verificationStatus: 'pending' }).populate('userId', 'name email phone');

  res.json({
    success: true,
    data: {
      totalUsers: usersCount,
      totalFarmers: farmersCount,
      totalCustomers: customersCount,
      totalOrders: orders.length,
      totalRevenue,
      pendingFarmers,
    }
  });
});

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  // Attach farmer profiles if they are farmers
  const farmersProfiles = await FarmerProfile.find({});
  const farmersMap = {};
  farmersProfiles.forEach(fp => {
    farmersMap[fp.userId.toString()] = fp;
  });

  const usersWithProfiles = users.map(user => {
    const userObj = user.toObject();
    if (user.role === 'farmer' && farmersMap[user._id.toString()]) {
      userObj.farmerProfile = farmersMap[user._id.toString()];
    }
    return userObj;
  });

  res.json({
    success: true,
    data: usersWithProfiles,
  });
});

// @desc    Approve farmer profile
// @route   PUT /api/users/admin/farmers/:id/approve
// @access  Private/Admin
const approveFarmer = asyncHandler(async (req, res) => {
  const farmerProfile = await FarmerProfile.findById(req.params.id);
  if (farmerProfile) {
    farmerProfile.verificationStatus = 'approved';
    await farmerProfile.save();

    // Notify the farmer about approval
    const io = req.app.get('io');
    if (io && farmerProfile.userId) {
      await createNotification(io, {
        recipientId: farmerProfile.userId,
        type: 'farmer_approved',
        title: 'Account Approved',
        message: `Congratulations! Your farm "${farmerProfile.farmName}" has been approved. You can now start listing products.`,
        icon: 'check-circle',
        color: 'emerald',
        link: '/dashboard/farmer',
        referenceId: farmerProfile._id,
      });
    }

    res.json({ success: true, message: 'Farmer approved successfully' });
  } else {
    res.status(404);
    throw new Error('Farmer profile not found');
  }
});
// @desc    Reject farmer profile
// @route   PUT /api/users/admin/farmers/:id/reject
// @access  Private/Admin
const rejectFarmer = asyncHandler(async (req, res) => {
  const farmerProfile = await FarmerProfile.findById(req.params.id);
  if (farmerProfile) {
    farmerProfile.verificationStatus = 'rejected';
    await farmerProfile.save();

    // Notify the farmer about rejection
    const io = req.app.get('io');
    if (io && farmerProfile.userId) {
      await createNotification(io, {
        recipientId: farmerProfile.userId,
        type: 'farmer_rejected',
        title: 'Account Not Approved',
        message: `Your farm "${farmerProfile.farmName}" registration was not approved. Please contact support for more details.`,
        icon: 'x-circle',
        color: 'red',
        link: '/contact',
        referenceId: farmerProfile._id,
      });
    }

    res.json({ success: true, message: 'Farmer rejected successfully' });
  } else {
    res.status(404);
    throw new Error('Farmer profile not found');
  }
});

// @desc    Get public farmer profile + their available products
// @route   GET /api/users/farmer/:id/profile
// @access  Public
const getFarmerPublicProfile = asyncHandler(async (req, res) => {
  // Support both the FarmerProfile _id and the underlying User _id
  let farmerProfile = await FarmerProfile.findById(req.params.id).catch(() => null);
  if (!farmerProfile) {
    farmerProfile = await FarmerProfile.findOne({ userId: req.params.id });
  }

  if (!farmerProfile) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  const products = await Product.find({ farmerId: farmerProfile._id, isAvailable: true }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      farmer: farmerProfile,
      products,
    },
  });
});

// @desc    Remove user (ban/delete) and send email with reason
// @route   DELETE /api/users/admin/:id/remove
// @access  Private/Admin
const removeUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);
  
  if (user) {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot remove admin users');
    }
    
    // SIMULATED EMAIL SENDING
    console.log(`\n\n=== ✉️ EMAIL SENT TO: ${user.email} ===`);
    console.log(`Subject: Account Removal Notification`);
    console.log(`Message: Hello ${user.name},\nYour account has been removed by the platform administrator.`);
    console.log(`Reason provided: "${reason || 'Violation of terms / Misbehavior'}"`);
    console.log(`=====================================\n\n`);

    // Remove user from DB
    await User.deleteOne({ _id: user._id });
    
    // Also remove their farmer profile if they are a farmer
    if (user.role === 'farmer') {
      await FarmerProfile.deleteOne({ userId: user._id });
    }

    res.json({ success: true, message: 'User removed successfully and email sent' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAdminDashboard,
  getAllUsers,
  getAllFarmers,
  approveFarmer,
  rejectFarmer,
  getFarmerPublicProfile,
  removeUser,
};
