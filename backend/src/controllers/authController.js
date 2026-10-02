const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const generateToken = require('../utils/generateToken');
const { sendLoginNotification } = require('../services/emailService');
const { notifyAllAdmins } = require('../utils/notificationHelper');

// ──────────────────────────────────────────────────────────────
// @desc    Register a new user (email + password)
// @route   POST /api/auth/register
// @access  Public
// ──────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address, city, state, pincode, farmName, farmAddress, farmDescription, governmentId } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    // If they have a Google account but no password yet, they must use Set Password flow
    if (userExists.googleId && !userExists.password) {
      res.status(400);
      throw new Error('This email is already registered via Google Sign-In. Please log in with Google, then use Set Password to add email/password login.');
    }
    res.status(400);
    throw new Error('An account with this email already exists. Please log in instead.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Whitelist role: self-registration is strictly restricted to 'customer' or 'farmer'
  const assignedRole = role === 'farmer' ? 'farmer' : 'customer';

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role: assignedRole,
    address,
    city,
    state,
    pincode,
    isVerified: true,
  });

  if (user) {
    // If role is farmer, create farmer profile
    if (user.role === 'farmer') {
      const farmerProfile = await FarmerProfile.create({
        userId: user._id,
        farmName: farmName || `${name}'s Farm`,
        ownerName: name,
        farmAddress: farmAddress || address,
        city,
        state,
        pincode,
        farmDescription,
        governmentId,
        verificationStatus: 'pending',
      });

      // Notify admins about new farmer registration
      const io = req.app.get('io');
      if (io) {
        await notifyAllAdmins(io, {
          type: 'farmer_registration',
          title: 'New Farmer Registration',
          message: `${name} registered as a farmer (${farmName || name + "'s Farm"}) and needs approval.`,
          icon: 'user-plus',
          color: 'orange',
          link: '/dashboard/admin?tab=dashboard',
          referenceId: farmerProfile._id,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        role: user.role,
        farmerProfile: user.role === 'farmer' ? {
          userId: user._id,
          farmName: farmName || `${name}'s Farm`,
          ownerName: name,
          farmAddress: farmAddress || address,
          city,
          state,
          pincode,
          farmDescription,
          governmentId,
          verificationStatus: 'pending',
        } : undefined,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// ──────────────────────────────────────────────────────────────
// @desc    Auth user & get token (email + password)
// @route   POST /api/auth/login
// @access  Public
// ──────────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role: requestedRole } = req.body;

  // Fetch user — must select password since it's excluded by default
  const user = await User.findOne({ email }).select('+password');

  // Account exists but was created only via Google (no password set)
  if (user && !user.password) {
    res.status(401);
    throw new Error('This account was created with Google Sign-In. Please use \'Continue with Google\' to log in, or set a password from your account settings.');
  }

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Account deactivated. Please contact support.');
  }

  // ── ROLE ENFORCEMENT ──────────────────────────────────────────
  // The frontend sends the tab the user clicked (customer / farmer / admin).
  // If the stored role doesn't match, reject the login entirely.
  if (requestedRole && requestedRole !== 'admin' && user.role !== requestedRole) {
    const displayActual = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const displayRequested = requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1);
    res.status(403);
    throw new Error(`This account is registered as a ${displayActual}. Please log in from the ${displayActual} page or use a different account to register as a ${displayRequested}.`);
  }

  let extraData = {};
  if (user.role === 'farmer') {
    const farmerProfile = await FarmerProfile.findOne({ userId: user._id });
    extraData = { farmerProfile };
  }

  const isFirstTime = !user.lastLogin;
  user.lastLogin = new Date();
  await user.save();

  // Send login notification (non-blocking)
  sendLoginNotification(user, isFirstTime).catch((err) =>
    console.error('[EmailService] Failed to send login notification:', err.message)
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      role: user.role,
      hasPassword: true,
      hasGoogleAuth: !!user.googleId,
      ...extraData,
      token: generateToken(user._id),
    },
  });
});

// ──────────────────────────────────────────────────────────────
// @desc    Set / update the password for a Google-registered account
// @route   POST /api/auth/set-password
// @access  Private (JWT required)
// ──────────────────────────────────────────────────────────────
const setPassword = asyncHandler(async (req, res) => {
  const { newPassword, currentPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // If account already has a password, require the current one for verification
  if (user.password) {
    if (!currentPassword) {
      res.status(400);
      throw new Error('Your current password is required to set a new one.');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({
    success: true,
    message: 'Password set successfully. You can now also log in with email and password.',
  });
});

// ──────────────────────────────────────────────────────────────
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
// ──────────────────────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (user) {
    let extraData = {};
    if (user.role === 'farmer') {
      const farmerProfile = await FarmerProfile.findOne({ userId: user._id });
      extraData = { farmerProfile };
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        profileImage: user.profileImage,
        hasPassword: !!user.password,
        hasGoogleAuth: !!user.googleId,
        ...extraData
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// ──────────────────────────────────────────────────────────────
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
// ──────────────────────────────────────────────────────────────
const logoutUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'User logged out successfully',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  setPassword,
};
