const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const generateToken = require('../utils/generateToken');
const { sendLoginNotification } = require('../services/emailService');

// ──────────────────────────────────────────────────────────────
// Passport Google Strategy
// ──────────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:5001'}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // The role the user selected on the login/register tab — carried through OAuth `state`
        const requestedRole = req.query.state || 'customer';
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const profileImage = profile.photos?.[0]?.value || 'default.jpg';

        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        // ── Step 1: Look up by stable Google ID first ─────────────────────
        // This is the only reliable identifier. Never trust email alone for linking.
        let user = await User.findOne({ googleId }).select('+password');

        if (user) {
          // Block admins from Google login
          if (user.role === 'admin') {
            return done(new Error('Admins must use email and password to log in'), null);
          }

          // ── ROLE ENFORCEMENT ────────────────────────────────────────────
          // Each account has one permanent role. Reject mismatches.
          if (user.role !== requestedRole) {
            const displayActual = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            const displayRequested = requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1);
            return done(
              new Error(
                `Role Mismatch: This Gmail account is already registered as a ${displayActual}. Please log in from the ${displayActual} page or use a different Google account to register as a ${displayRequested}.`
              ),
              null
            );
          }

          // Correct Google ID, correct role — authenticate
          return done(null, { user, isNew: false });
        }

        // ── Step 2: Check if the email is already registered ──────────────
        // Rule 4: Do NOT silently link by email. Require explicit verification.
        const emailUser = await User.findOne({ email }).select('+password');
        if (emailUser) {
          // Email is already tied to a different Google account — reject
          if (emailUser.googleId) {
            return done(
              new Error('This email is associated with a different Google account. Please use the Google account you originally registered with.'),
              null
            );
          }

          // Email account exists (email+password user), no Google link yet.
          // Enforce role: can only link Google to an account of the same role.
          if (emailUser.role !== requestedRole) {
            const displayActual = emailUser.role.charAt(0).toUpperCase() + emailUser.role.slice(1);
            const displayRequested = requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1);
            return done(
              new Error(
                `Role Mismatch: This Gmail account is already registered as a ${displayActual}. Please log in from the ${displayActual} page or use a different Google account to register as a ${displayRequested}.`
              ),
              null
            );
          }

          // Same role + email matches — safe to link Google to this existing account.
          // This is the legitimate "I had email/password, now I also want Google" flow.
          emailUser.googleId = googleId;
          if (!emailUser.profileImage || emailUser.profileImage === 'default.jpg') {
            emailUser.profileImage = profileImage;
          }
          await emailUser.save();
          return done(null, { user: emailUser, isNew: false });
        }

        // ── Step 3: Brand-new user — create with the role they selected ───
        user = await User.create({
          name,
          email,
          googleId,
          profileImage,
          role: requestedRole,
          isVerified: true,
          isActive: true,
        });

        if (requestedRole === 'farmer') {
          await FarmerProfile.create({
            userId: user._id,
            farmName: user.name + "'s Farm",
            ownerName: user.name,
            verificationStatus: 'pending'
          });
        }

        return done(null, { user, isNew: true });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Stateless serialise/deserialise (no server-side sessions — JWT only)
passport.serializeUser((data, done) => done(null, data));
passport.deserializeUser((data, done) => done(null, data));

// ──────────────────────────────────────────────────────────────
// @desc    Start Google OAuth
// @route   GET /api/auth/google?role=customer|farmer
// @access  Public
// ──────────────────────────────────────────────────────────────
const googleAuth = (req, res, next) => {
  const role = ['customer', 'farmer'].includes(req.query.role) ? req.query.role : 'customer';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: role,
  })(req, res, next);
};

// ──────────────────────────────────────────────────────────────
// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
// ──────────────────────────────────────────────────────────────
const googleAuthCallback = [
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, data) => {
      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

      if (err) {
        // Strip the "Role Mismatch: " prefix — the rest is the user-facing message
        if (err.message && err.message.startsWith('Role Mismatch: ')) {
          const friendlyMessage = err.message.replace('Role Mismatch: ', '');
          return res.redirect(`${clientURL}/login?error=${encodeURIComponent(friendlyMessage)}`);
        }
        return res.redirect(`${clientURL}/login?error=${encodeURIComponent(err.message || 'Google sign-in failed. Please try again.')}`);
      }

      if (!data) {
        return res.redirect(`${clientURL}/login?error=${encodeURIComponent('Google sign-in failed. Please try again.')}`);
      }

      req.user = data;
      next();
    })(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const { user, isNew } = req.user;
    const token = generateToken(user._id);
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

    const isFirstTime = !user.lastLogin;
    user.lastLogin = new Date();
    await user.save();

    // Send login notification (non-blocking)
    sendLoginNotification(user, isFirstTime).catch((err) =>
      console.error('[EmailService] Failed to send login notification:', err.message)
    );

    const params = new URLSearchParams({
      token,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isNew: isNew ? '1' : '0',
      hasPassword: user.password ? '1' : '0',
      profileImage: user.profileImage || '',
    });

    res.redirect(`${clientURL}/auth/google/callback?${params.toString()}`);
  }),
];

// ──────────────────────────────────────────────────────────────
// @desc    Complete farmer profile for a brand-new Google signup.
//          Role is already set at account creation — this endpoint
//          only saves farm details. It does NOT allow role mutation.
// @route   POST /api/auth/google/complete-profile
// @access  Private (JWT required)
// ──────────────────────────────────────────────────────────────
const completeGoogleProfile = asyncHandler(async (req, res) => {
  const { farmName, farmAddress, farmDescription, city, state, pincode } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Use the role that is already permanently stored on the account
  const role = user.role;

  let farmerProfile;
  if (role === 'farmer') {
    farmerProfile = await FarmerProfile.findOneAndUpdate(
      { userId: user._id },
      {
        farmName: farmName || `${user.name}'s Farm`,
        ownerName: user.name,
        farmAddress: farmAddress || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        farmDescription: farmDescription || '',
        verificationStatus: 'pending',
      },
      { new: true, upsert: true }
    );
  }

  res.json({
    success: true,
    message: 'Profile completed',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token: generateToken(user._id),
      farmerProfile: farmerProfile || undefined,
    },
  });
});

module.exports = { googleAuth, googleAuthCallback, completeGoogleProfile };
