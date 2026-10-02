const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification, save to DB, and emit via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {Object} params
 * @param {String} params.recipientId - User ID of the recipient
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {String} [params.icon] - Lucide icon name
 * @param {String} [params.color] - Theme color
 * @param {String} [params.link] - Navigation link
 * @param {String} [params.referenceId] - Reference ID (orderId, etc.)
 */
const createNotification = async (io, params) => {
  try {
    const notification = await Notification.create({
      recipient: params.recipientId,
      type: params.type || 'general',
      title: params.title,
      message: params.message,
      icon: params.icon || 'bell',
      color: params.color || 'blue',
      link: params.link || '',
      referenceId: params.referenceId || undefined,
    });

    // Emit real-time notification via socket
    if (io) {
      io.to(params.recipientId.toString()).emit('notification', {
        _id: notification._id,
        type: params.type || 'general',
        title: params.title,
        message: params.message,
        icon: params.icon || 'bell',
        color: params.color || 'blue',
        link: params.link || '',
        referenceId: params.referenceId,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    return notification;
  } catch (err) {
    console.error('[NotificationHelper] Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Send a notification to all admin users
 */
const notifyAllAdmins = async (io, params) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification(io, {
        ...params,
        recipientId: admin._id,
      });
    }
  } catch (err) {
    console.error('[NotificationHelper] Failed to notify admins:', err.message);
  }
};

module.exports = { createNotification, notifyAllAdmins };
