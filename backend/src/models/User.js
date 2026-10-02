const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'farmer', 'admin'],
      default: 'customer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: 'default.jpg',
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    lastLogin: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
