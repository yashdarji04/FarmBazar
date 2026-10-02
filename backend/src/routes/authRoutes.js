const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, logoutUser, setPassword } = require('../controllers/authController');
const { googleAuth, googleAuthCallback, completeGoogleProfile } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/authMiddleware');

// Standard auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);

// Set / change password (Google users adding email/password login, or changing password)
router.post('/set-password', protect, setPassword);

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.post('/google/complete-profile', protect, completeGoogleProfile);

module.exports = router;
