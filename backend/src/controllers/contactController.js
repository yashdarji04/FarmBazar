const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
const { notifyAllAdmins } = require('../utils/notificationHelper');

// @desc    Send a message from the public Contact page
// @route   POST /api/contact
// @access  Public
const sendContactMessage = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  // 1. Save to Database
  const contact = await Contact.create({
    firstName,
    lastName,
    email,
    subject: subject || 'General Inquiry',
    message,
  });

  // Notify admins about new contact inquiry
  const io = req.app.get('io');
  if (io) {
    await notifyAllAdmins(io, {
      type: 'new_contact',
      title: 'New Contact Inquiry',
      message: `${firstName} ${lastName} sent a message: "${(subject || 'General Inquiry')}".`,
      icon: 'mail',
      color: 'violet',
      link: '/dashboard/admin?tab=support',
      referenceId: contact._id,
    });
  }

  // 2. Send Email (if configured)
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Contact form submission (email not configured, saved to DB):', {
      firstName, lastName, email, subject, message,
    });
    res.json({ success: true, message: 'Message received' });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HarvestDirect Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Contact] ${subject || 'General Inquiry'} — from ${firstName} ${lastName}`,
      text: `From: ${firstName} ${lastName} <${email}>\nSubject: ${subject || 'General Inquiry'}\n\n${message}`,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    // Even if email fails, it's saved in DB, so we return success.
  }

  res.json({ success: true, message: 'Message sent successfully' });
});

// @desc    Get all contact inquiries
// @route   GET /api/contact/admin/all
// @access  Private/Admin
const getAllInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Contact.find({}).sort({ createdAt: -1 });
  res.json({
    success: true,
    count: inquiries.length,
    data: inquiries,
  });
});

// @desc    Update inquiry status
// @route   PUT /api/contact/admin/:id/status
// @access  Private/Admin
const updateInquiryStatus = asyncHandler(async (req, res) => {
  const inquiry = await Contact.findById(req.params.id);

  if (!inquiry) {
    res.status(404);
    throw new Error('Inquiry not found');
  }

  inquiry.status = req.body.status || 'Resolved';
  const updatedInquiry = await inquiry.save();

  res.json({
    success: true,
    data: updatedInquiry,
  });
});

module.exports = { 
  sendContactMessage,
  getAllInquiries,
  updateInquiryStatus
};
