const nodemailer = require('nodemailer');

/**
 * Get email credentials with safe fallbacks and space trimming.
 */
const getEmailCredentials = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const user = process.env.EMAIL_USER || 'yashdarji7013@gmail.com';
  const pass = (process.env.EMAIL_PASS || 'gvgm fmet yvzc srvx').replace(/\s+/g, '');
  return { host, port, user, pass };
};

/**
 * Create a Nodemailer transporter using environment variables.
 * Supports Gmail (smtp.gmail.com) out of the box with direct SSL (port 465).
 */
const createTransporter = () => {
  const { host, port, user, pass } = getEmailCredentials();
  const isGmail = host.includes('gmail');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

/**
 * Send a login notification email to the user's Gmail address.
 * @param {{ name: string, email: string, role: string }} user
 */
const sendLoginNotification = async (user, isFirstTime = false) => {
  const { user: emailUser } = getEmailCredentials();
  // Don't crash the login flow if email is not configured
  if (!emailUser || emailUser === 'demo') {
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
    from: `"FarmBazar" <${emailUser}>`,
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
  const { user: emailUser } = getEmailCredentials();
  if (!emailUser || emailUser === 'demo') {
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
    from: `"FarmBazar" <${emailUser}>`,
    to: user.email,
    subject: `🛒 Invoice for your FarmBazar Order #${order.orderNumber}`,
    html,
  });

  console.log(`[EmailService] Order invoice sent to ${user.email}`);
};

/**
 * Send a new-order alert email to a farmer after confirmed payment.
 *
 * @param {{ name: string, email: string }} farmer   – Farmer user (fetched from DB by userId)
 * @param {{ name: string, email: string }} customer – Customer who placed the order
 * @param {Object} subOrder  – Farmer-specific sub-order slice {items, subtotal}
 * @param {Object} order     – Full order {orderNumber, paymentMethod, deliveryAddress,
 *                             receiverName, receiverPhone, totalAmount, placedAt, …}
 */
const sendFarmerOrderNotificationEmail = async (farmer, customer, subOrder, order) => {
  const { user: emailUser } = getEmailCredentials();
  if (!emailUser || emailUser === 'demo') {
    console.log('[EmailService] Email not configured — skipping farmer order notification.');
    return;
  }

  const transporter = createTransporter();

  // Order date — use the order's placedAt or createdAt, fall back to now
  const orderDate = new Date(order.placedAt || order.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Build one rich HTML row per product in the sub-order
  const itemRowsHtml = subOrder.items.map(item => {
    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}"
           style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block;" />`
      : `<div style="width:56px;height:56px;background:#e8f5e9;border-radius:8px;
           display:flex;align-items:center;justify-content:center;font-size:22px;">🌿</div>`;

    const lineTotal = Number(item.price) * Number(item.quantity);

    return `
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;">
          ${imgHtml}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            font-weight:600;color:#1b5e20;">
          ${item.name}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:center;color:#555;">
          ${item.quantity} ${item.unit || 'unit'}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:right;color:#555;">
          ₹${Number(item.price).toFixed(2)}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:right;font-weight:700;color:#2e7d32;">
          ₹${lineTotal.toFixed(2)}
        </td>
      </tr>`;
  }).join('');

  const dashboardUrl = `${process.env.CLIENT_URL || 'https://farm-bazar.vercel.app'}/dashboard/farmer?tab=orders`;
  const siteUrl     = process.env.CLIENT_URL || 'https://farm-bazar.vercel.app';
  const year        = orderDate.getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>New Product Order Received – FarmBazar</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 0;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.09);max-width:600px;">

      <!-- ── HEADER ── -->
      <tr>
        <td style="background:linear-gradient(135deg,#1b5e20 0%,#2e7d32 55%,#558b2f 100%);
                   padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:-0.5px;">🌿 FarmBazar</h1>
          <p  style="color:rgba(255,255,255,.82);font-size:14px;margin:8px 0 0;">
            Farm-fresh, straight from the source
          </p>
          <span style="display:inline-block;background:#fff3e0;color:#e65100;
                       padding:5px 16px;border-radius:20px;font-size:13px;font-weight:700;
                       margin-top:16px;letter-spacing:.5px;">
            🛒 New Order Received!
          </span>
        </td>
      </tr>

      <!-- ── GREETING ── -->
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="font-size:19px;font-weight:700;color:#1b5e20;margin:0 0 10px;">
            Congratulations, ${farmer.name}! 🎉
          </p>
          <p style="font-size:15px;color:#424242;line-height:1.65;margin:0 0 28px;">
            You have received a new order for your farm product on
            <strong>FarmBazar</strong>. Please review the details below and
            prepare the items for dispatch promptly.
          </p>
        </td>
      </tr>

      <!-- ── ORDER META ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <p style="font-size:15px;font-weight:700;color:#1b5e20;margin:0 0 12px;">
            📦 Order Details
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f1f8e9;border-left:4px solid #558b2f;
                        border-radius:8px;padding:0;font-size:14px;">
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;width:45%;">Order ID</td>
              <td style="padding:12px 20px;color:#1b5e20;font-weight:700;">#${order.orderNumber}</td>
            </tr>
            <tr style="background:#e8f5e9;">
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Order Date</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">${formattedDate} IST</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Customer Name</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">${customer.name}</td>
            </tr>
            <tr style="background:#e8f5e9;">
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Payment Method</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">${order.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Payment Status</td>
              <td style="padding:12px 20px;font-weight:700;
                         color:${order.paymentStatus === 'Completed' ? '#2e7d32' : '#e65100'};">
                ${order.paymentStatus === 'Completed' ? '✅ Paid' : '⏳ ' + order.paymentStatus}
              </td>
            </tr>
            <tr style="background:#e8f5e9;">
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Deliver To</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;line-height:1.5;">
                ${order.receiverName} &bull; ${order.receiverPhone}<br/>
                ${order.deliveryAddress?.address || ''},
                ${order.deliveryAddress?.city || ''},
                ${order.deliveryAddress?.state || ''} –
                ${order.deliveryAddress?.pincode || ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── PRODUCTS TABLE ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <p style="font-size:15px;font-weight:700;color:#1b5e20;margin:0 0 12px;">
            🧺 Your Products in This Order
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border-collapse:collapse;font-size:14px;border:1px solid #e8f5e9;
                        border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f1f8e9;">
                <th style="padding:12px;text-align:left;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;width:64px;">Photo</th>
                <th style="padding:12px;text-align:left;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Product</th>
                <th style="padding:12px;text-align:center;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Qty</th>
                <th style="padding:12px;text-align:right;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Unit Price</th>
                <th style="padding:12px;text-align:right;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- ── EARNINGS SUMMARY ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;
                        font-size:16px;font-weight:700;color:#1b5e20;">
            <tr>
              <td style="padding:16px 20px;">💰 Your Earnings (Subtotal)</td>
              <td style="padding:16px 20px;text-align:right;">
                ₹${Number(subOrder.subtotal).toFixed(2)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── CTA ── -->
      <tr>
        <td style="padding:0 40px 36px;text-align:center;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#2e7d32,#558b2f);
                    color:#fff;text-decoration:none;padding:15px 36px;border-radius:30px;
                    font-size:15px;font-weight:700;letter-spacing:.3px;">
            View Order in Dashboard →
          </a>
          <p style="margin:20px 0 0;font-size:13px;color:#9e9e9e;line-height:1.5;">
            Please process this order promptly to maintain your seller rating. 🌾<br/>
            Thank you for being a valued farmer on <strong>FarmBazar</strong>!
          </p>
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td style="background:#f4f7f4;padding:20px 40px;text-align:center;
                   font-size:12px;color:#9e9e9e;">
          &copy; ${year} FarmBazar Marketplace &bull;
          <a href="${siteUrl}" style="color:#558b2f;text-decoration:none;">Visit Website</a>
          &bull; Best Regards, FarmBazar Team
        </td>
      </tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"FarmBazar" <${emailUser}>`,
    to: farmer.email,
    subject: `New Product Order Received – FarmBazar (#${order.orderNumber})`,
    html,
  });

  console.log(`[EmailService] Farmer order notification sent to ${farmer.email} for order #${order.orderNumber}`);
};

/**
 * Send an order completion / delivery confirmation email to a farmer.
 *
 * @param {{ name: string, email: string }} farmer   – Farmer user (fetched from DB by userId)
 * @param {{ name: string, email: string }} customer – Customer who placed the order
 * @param {Object} subOrder  – Farmer-specific sub-order slice {items, subtotal, deliveredAt, …}
 * @param {Object} order     – Full order {orderNumber, paymentMethod, deliveryAddress,
 *                             receiverName, receiverPhone, totalAmount, deliveredAt, …}
 */
const sendFarmerOrderCompletedEmail = async (farmer, customer, subOrder, order) => {
  const { user: emailUser } = getEmailCredentials();
  if (!emailUser || emailUser === 'demo') {
    console.log('[EmailService] Email not configured — skipping farmer order completed notification.');
    return;
  }

  const transporter = createTransporter();

  // Completion date
  const completedDate = new Date(subOrder.deliveredAt || order.deliveredAt || Date.now());
  const formattedDate = completedDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Build product items table
  const itemRowsHtml = (subOrder.items || []).map(item => {
    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}"
           style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block;" />`
      : `<div style="width:56px;height:56px;background:#e8f5e9;border-radius:8px;
           display:flex;align-items:center;justify-content:center;font-size:22px;">🌾</div>`;

    const lineTotal = Number(item.price) * Number(item.quantity);

    return `
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;">
          ${imgHtml}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            font-weight:600;color:#1b5e20;">
          ${item.name}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:center;color:#555;">
          ${item.quantity} ${item.unit || 'unit'}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:right;color:#555;">
          ₹${Number(item.price).toFixed(2)}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e8f5e9;vertical-align:middle;
            text-align:right;font-weight:700;color:#2e7d32;">
          ₹${lineTotal.toFixed(2)}
        </td>
      </tr>`;
  }).join('');

  const dashboardUrl = `${process.env.CLIENT_URL || 'https://farm-bazar.vercel.app'}/dashboard/farmer?tab=orders`;
  const siteUrl     = process.env.CLIENT_URL || 'https://farm-bazar.vercel.app';
  const year        = completedDate.getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Completed – FarmBazar</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:32px 0;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:16px;overflow:hidden;
                  box-shadow:0 4px 24px rgba(0,0,0,0.09);max-width:600px;">

      <!-- ── HEADER ── -->
      <tr>
        <td style="background:linear-gradient(135deg,#004d40 0%,#1b5e20 60%,#2e7d32 100%);
                   padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:-0.5px;">🌿 FarmBazar</h1>
          <p  style="color:rgba(255,255,255,.85);font-size:14px;margin:8px 0 0;">
            Direct from Farmers &bull; Pure Freshness
          </p>
          <span style="display:inline-block;background:#e8f5e9;color:#1b5e20;
                       padding:6px 18px;border-radius:20px;font-size:13px;font-weight:700;
                       margin-top:16px;letter-spacing:.5px;">
            ✅ Order Completed & Delivered!
          </span>
        </td>
      </tr>

      <!-- ── GREETING ── -->
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="font-size:19px;font-weight:700;color:#1b5e20;margin:0 0 10px;">
            Great job, ${farmer.name}! 🌟
          </p>
          <p style="font-size:15px;color:#424242;line-height:1.65;margin:0 0 28px;">
            Your order <strong>#${order.orderNumber}</strong> has been successfully marked as
            <strong style="color:#2e7d32;">Delivered & Completed</strong>.
            Thank you for providing fresh, top-quality produce to our customers!
          </p>
        </td>
      </tr>

      <!-- ── ORDER SUMMARY CARD ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <p style="font-size:15px;font-weight:700;color:#1b5e20;margin:0 0 12px;">
            📦 Completion Summary
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f1f8e9;border-left:4px solid #2e7d32;
                        border-radius:8px;padding:0;font-size:14px;">
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;width:45%;">Order ID</td>
              <td style="padding:12px 20px;color:#1b5e20;font-weight:700;">#${order.orderNumber}</td>
            </tr>
            <tr style="background:#e8f5e9;">
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Delivered At</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">${formattedDate} IST</td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Customer</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">${customer.name}</td>
            </tr>
            <tr style="background:#e8f5e9;">
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Recipient</td>
              <td style="padding:12px 20px;color:#212121;font-weight:600;">
                ${order.receiverName} &bull; ${order.receiverPhone}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 20px;color:#757575;font-weight:500;">Payment Status</td>
              <td style="padding:12px 20px;font-weight:700;color:#2e7d32;">
                ✅ Completed (${order.paymentMethod})
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── DELIVERED ITEMS ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <p style="font-size:15px;font-weight:700;color:#1b5e20;margin:0 0 12px;">
            🧺 Completed Items
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border-collapse:collapse;font-size:14px;border:1px solid #e8f5e9;
                        border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f1f8e9;">
                <th style="padding:12px;text-align:left;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;width:64px;">Photo</th>
                <th style="padding:12px;text-align:left;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Product</th>
                <th style="padding:12px;text-align:center;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Qty</th>
                <th style="padding:12px;text-align:right;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Unit Price</th>
                <th style="padding:12px;text-align:right;color:#616161;font-weight:600;
                           border-bottom:2px solid #c8e6c9;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>
        </td>
      </tr>

      <!-- ── EARNINGS EARNED ── -->
      <tr>
        <td style="padding:0 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);
                        border:1px solid #81c784;border-radius:8px;
                        font-size:16px;font-weight:700;color:#1b5e20;">
            <tr>
              <td style="padding:16px 20px;">💰 Total Earned From This Order</td>
              <td style="padding:16px 20px;text-align:right;font-size:18px;">
                ₹${Number(subOrder.subtotal).toFixed(2)}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── CTA ── -->
      <tr>
        <td style="padding:0 40px 36px;text-align:center;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#1b5e20,#2e7d32);
                    color:#fff;text-decoration:none;padding:15px 36px;border-radius:30px;
                    font-size:15px;font-weight:700;letter-spacing:.3px;">
            View Orders in Farmer Dashboard →
          </a>
          <p style="margin:20px 0 0;font-size:13px;color:#9e9e9e;line-height:1.5;">
            Keep up the great work! Satisfied customers leave great ratings and re-order often. 🌾<br/>
            Thank you for partnering with <strong>FarmBazar</strong>!
          </p>
        </td>
      </tr>

      <!-- ── FOOTER ── -->
      <tr>
        <td style="background:#f4f7f4;padding:20px 40px;text-align:center;
                   font-size:12px;color:#9e9e9e;">
          &copy; ${year} FarmBazar Marketplace &bull;
          <a href="${siteUrl}" style="color:#558b2f;text-decoration:none;">Visit Website</a>
          &bull; Best Regards, FarmBazar Team
        </td>
      </tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"FarmBazar" <${emailUser}>`,
    to: farmer.email,
    subject: `🎉 Order Completed – ₹${Number(subOrder.subtotal).toFixed(2)} for Order #${order.orderNumber} – FarmBazar`,
    html,
  });

  console.log(`[EmailService] Farmer order completed notification sent to ${farmer.email} for order #${order.orderNumber}`);
};

module.exports = {
  sendLoginNotification,
  sendOrderInvoiceEmail,
  sendFarmerOrderNotificationEmail,
  sendFarmerOrderCompletedEmail,
};
