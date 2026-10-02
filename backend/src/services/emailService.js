const nodemailer = require('nodemailer');

/**
 * Create a Nodemailer transporter using environment variables.
 * Supports Gmail (smtp.gmail.com) out of the box.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send a login notification email to the user's Gmail address.
 * @param {{ name: string, email: string, role: string }} user
 */
const sendLoginNotification = async (user, isFirstTime = false) => {
  // Don't crash the login flow if email is not configured
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'demo') {
    console.log('[EmailService] Email not configured — skipping login notification.');
    return;
  }

  const transporter = createTransporter();
  const now = new Date();
  const formattedTime = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const roleLabel = user.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>FarmBazar Login Notification</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f4; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2e7d32 0%, #558b2f 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 26px; margin: 0; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1b5e20; margin-bottom: 12px; }
        .message { font-size: 15px; color: #424242; line-height: 1.6; margin-bottom: 24px; }
        .info-card { background: #f1f8e9; border-left: 4px solid #558b2f; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #757575; font-weight: 500; }
        .info-value { color: #212121; font-weight: 600; }
        .warning { background: #fff8e1; border-left: 4px solid #f9a825; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #5d4037; line-height: 1.5; margin-bottom: 24px; }
        .footer { background: #f4f7f4; text-align: center; padding: 20px 40px; font-size: 12px; color: #9e9e9e; }
        .footer a { color: #558b2f; text-decoration: none; }
        .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🌿 FarmBazar</h1>
          <p>Farm-fresh, straight from the source</p>
        </div>
        <div class="body">
          <p class="greeting">${isFirstTime ? `Welcome, ${user.name}! 🎉` : `Welcome back, ${user.name}! 👋`}</p>
          <p class="message">
            ${isFirstTime ? 'Thank you for joining <strong>FarmBazar</strong>! Your very first sign-in was successful. Here are the details:' : 'We noticed a successful sign-in to your <strong>FarmBazar</strong> account. Here are the details:'}
          </p>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Account</span>
              <span class="info-value">${user.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Role</span>
              <span class="info-value"><span class="badge">${roleLabel}</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Time</span>
              <span class="info-value">${formattedTime} IST</span>
            </div>
          </div>
          <div class="warning">
            ⚠️ <strong>Not you?</strong> If you didn't sign in, please change your password immediately or contact our support team.
          </div>
          <p class="message">Thank you for being part of the FarmBazar community! 🌾</p>
        </div>
        <div class="footer">
          &copy; ${now.getFullYear()} FarmBazar Marketplace &bull; 
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Visit Website</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"FarmBazar" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `✅ New sign-in to your FarmBazar account`,
    html,
  });

  console.log(`[EmailService] Login notification sent to ${user.email}`);
};

/**
 * Send an order invoice email to the customer's Gmail address.
 * @param {{ name: string, email: string }} user - The customer user object
 * @param {Object} order - The created order object
 */
const sendOrderInvoiceEmail = async (user, order) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'demo') {
    console.log('[EmailService] Email not configured — skipping order invoice notification.');
    return;
  }

  const transporter = createTransporter();
  const now = new Date();
  const formattedTime = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>FarmBazar Order Invoice</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f4; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #2e7d32 0%, #558b2f 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 26px; margin: 0; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1b5e20; margin-bottom: 12px; }
        .message { font-size: 15px; color: #424242; line-height: 1.6; margin-bottom: 24px; }
        .info-card { background: #f1f8e9; border-left: 4px solid #558b2f; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #757575; font-weight: 500; }
        .info-value { color: #212121; font-weight: 600; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
        .items-table th { background: #fafafa; padding: 12px; text-align: left; font-weight: 600; color: #616161; border-bottom: 2px solid #eeeeee; }
        .summary-card { background: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; text-align: right; font-size: 14px; }
        .summary-row { display: flex; justify-content: flex-end; margin-bottom: 8px; gap: 24px; }
        .summary-label { color: #757575; font-weight: 500; }
        .summary-value { color: #212121; font-weight: 600; min-width: 80px; }
        .total-row { border-top: 1px solid #eeeeee; padding-top: 12px; margin-top: 4px; font-size: 16px; font-weight: 700; color: #1b5e20; }
        .footer { background: #f4f7f4; text-align: center; padding: 20px 40px; font-size: 12px; color: #9e9e9e; }
        .footer a { color: #558b2f; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🌿 FarmBazar</h1>
          <p>Order Confirmed - Thank You!</p>
        </div>
        <div class="body">
          <p class="greeting">Hello, ${user.name}!</p>
          <p class="message">
            We've received your order and are getting it ready. Here is your invoice:
          </p>
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Order Number</span>
              <span class="info-value">#${order.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${formattedTime} IST</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method</span>
              <span class="info-value">${order.paymentMethod}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Delivery To</span>
              <span class="info-value">${order.receiverName} (${order.receiverPhone})<br>${order.deliveryAddress.address}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-card">
            <div class="summary-row">
              <span class="summary-label">Subtotal:</span>
              <span class="summary-value">₹${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Delivery:</span>
              <span class="summary-value">₹${order.deliveryCharge.toFixed(2)}</span>
            </div>
            <div class="summary-row total-row">
              <span class="summary-label">Total Amount:</span>
              <span class="summary-value">₹${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <p class="message" style="text-align: center; margin-bottom: 0;">
            We'll notify you once your order is out for delivery. Enjoy the freshness! 🌾
          </p>
        </div>
        <div class="footer">
          &copy; ${now.getFullYear()} FarmBazar Marketplace &bull; 
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Visit Website</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"FarmBazar" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🛒 Invoice for your FarmBazar Order #${order.orderNumber}`,
    html,
  });

  console.log(`[EmailService] Order invoice sent to ${user.email}`);
};

module.exports = { sendLoginNotification, sendOrderInvoiceEmail };
