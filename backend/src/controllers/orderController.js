const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const FarmerProfile = require('../models/FarmerProfile');
const { sendOrderInvoiceEmail } = require('../services/emailService');
const { createNotification, notifyAllAdmins } = require('../utils/notificationHelper');

// @desc    Create new order (with farmer splitting)
// @route   POST /api/orders
// @access  Private/Customer
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    farmerId,
    orderItems,
    deliveryAddress,
    receiverName,
    receiverPhone,
    paymentMethod,
    paymentStatus,
    paymentId,
    subtotal,
    deliveryCharge,
    totalAmount,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Generate order number
  const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

  // Group items by farmerId by looking up products authoritative farmerId
  const farmerGroups = {};
  const enrichedItems = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name || item.product}`);
    }

    // Determine farmerId: from product or item or fallback
    const resolvedFarmerId = (product.farmerId || item.farmerId || farmerId)?.toString();
    if (!resolvedFarmerId) {
      res.status(400);
      throw new Error(`Unable to determine farmer for product: ${product.name}`);
    }

    if (!farmerGroups[resolvedFarmerId]) {
      farmerGroups[resolvedFarmerId] = {
        farmerId: resolvedFarmerId,
        items: [],
        subtotal: 0,
      };
    }

    const orderItem = {
      product: product._id,
      name: item.name || product.name,
      quantity: item.quantity,
      price: item.price !== undefined ? item.price : product.price,
      image: item.image || product.images?.[0] || '',
      unit: item.unit || product.unit || 'unit',
      farmerId: resolvedFarmerId,
    };

    farmerGroups[resolvedFarmerId].items.push(orderItem);
    farmerGroups[resolvedFarmerId].subtotal += orderItem.price * orderItem.quantity;
    enrichedItems.push(orderItem);
  }

  // Create sub-orders array
  const farmerOrders = Object.values(farmerGroups).map((group) => ({
    farmerId: group.farmerId,
    items: group.items,
    subtotal: group.subtotal,
    farmerOrderStatus: 'Placed',
    placedAt: Date.now(),
  }));

  const calculatedSubtotal = subtotal !== undefined ? Number(subtotal) : enrichedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const calculatedDeliveryCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : 0;
  const calculatedTotal = totalAmount !== undefined ? Number(totalAmount) : (calculatedSubtotal + calculatedDeliveryCharge);

  const order = new Order({
    orderNumber,
    customerId: req.user._id,
    farmerId: farmerOrders[0]?.farmerId || farmerId,
    items: enrichedItems,
    farmerOrders,
    deliveryAddress,
    receiverName,
    receiverPhone,
    paymentMethod,
    paymentStatus: paymentStatus || 'Pending',
    paymentId,
    subtotal: calculatedSubtotal,
    deliveryCharge: calculatedDeliveryCharge,
    totalAmount: calculatedTotal,
    orderStatus: 'Placed',
    placedAt: Date.now(),
  });

  const createdOrder = await order.save();

  // Create the corresponding Payment record for this order
  await Payment.create({
    orderId: createdOrder._id,
    amount: createdOrder.totalAmount,
    paymentMethod: createdOrder.paymentMethod,
    paymentStatus: createdOrder.paymentStatus,
  });

  // Deduct inventory
  for (const item of enrichedItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity = Math.max(0, product.quantity - item.quantity);
      if (product.quantity <= 0) {
        product.isAvailable = false;
        product.quantity = 0;
      }
      await product.save();
    }
  }

  // Send order invoice email asynchronously
  sendOrderInvoiceEmail(req.user, createdOrder).catch((err) =>
    console.error('[EmailService] Failed to send order invoice notification:', err.message)
  );

  // Notify each farmer via Socket.io + persist notification
  const io = req.app.get('io');
  if (io) {
    for (const subOrder of createdOrder.farmerOrders) {
      try {
        const farmerProfile = await FarmerProfile.findById(subOrder.farmerId);
        if (farmerProfile && farmerProfile.userId) {
          await createNotification(io, {
            recipientId: farmerProfile.userId,
            type: 'new_order',
            title: 'New Order Received',
            message: `You have received a new order (${orderNumber}) with ${subOrder.items.length} item(s) for ₹${subOrder.subtotal}.`,
            icon: 'shopping-cart',
            color: 'emerald',
            link: '/dashboard/farmer?tab=orders',
            referenceId: createdOrder._id,
          });
        }
      } catch (err) {
        console.error('[Notification] Error notifying farmer:', err.message);
      }
    }

    // Notify admins about new order
    await notifyAllAdmins(io, {
      type: 'new_order',
      title: 'New Order Placed',
      message: `Order ${orderNumber} placed by ${req.user.name} for ₹${createdOrder.totalAmount}.`,
      icon: 'package',
      color: 'blue',
      link: '/dashboard/admin?tab=orders',
      referenceId: createdOrder._id,
    });
  }

  res.status(201).json({ success: true, data: createdOrder });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name email phone')
    .populate('farmerId', 'farmName ownerName phone city')
    .populate('farmerOrders.farmerId', 'farmName ownerName phone city');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Customer authorization
  if (req.user.role === 'customer') {
    if (order.customerId._id.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
    return res.json({ success: true, data: order });
  }

  // Farmer authorization: must only see their own items & sub-order
  if (req.user.role === 'farmer') {
    const farmerProfile = await FarmerProfile.findOne({ userId: req.user._id });
    if (!farmerProfile) {
      res.status(403);
      throw new Error('Farmer profile not found');
    }

    const subOrder = order.farmerOrders?.find(
      (fo) => fo.farmerId?._id?.toString() === farmerProfile._id.toString() ||
              fo.farmerId?.toString() === farmerProfile._id.toString()
    );

    const isLegacyFarmer = order.farmerId?._id?.toString() === farmerProfile._id.toString();

    if (!subOrder && !isLegacyFarmer) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    if (subOrder) {
      return res.json({
        success: true,
        data: {
          _id: order._id,
          subOrderId: subOrder._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          deliveryAddress: order.deliveryAddress,
          receiverName: order.receiverName,
          receiverPhone: order.receiverPhone,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          items: subOrder.items,
          totalAmount: subOrder.subtotal,
          orderStatus: subOrder.farmerOrderStatus,
          cancelReason: subOrder.cancelReason,
          placedAt: subOrder.placedAt || order.placedAt,
          acceptedAt: subOrder.acceptedAt,
          packedAt: subOrder.packedAt,
          outForDeliveryAt: subOrder.outForDeliveryAt,
          deliveredAt: subOrder.deliveredAt,
          cancelledAt: subOrder.cancelledAt,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      });
    }

    return res.json({ success: true, data: order });
  }

  // Admin authorization: see complete order with all details
  if (req.user.role === 'admin') {
    return res.json({ success: true, data: order });
  }

  res.status(401);
  throw new Error('Not authorized to view this order');
});

// @desc    Update order status (farmer updates their own sub-order; admin updates any)
// @route   PUT /api/orders/:id/status
// @access  Private/Farmer/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, cancelReason, farmerId } = req.body;
  const order = await Order.findById(req.params.id)
    .populate('farmerOrders.farmerId')
    .populate('farmerId');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  let updatedFarmName = 'Farmer';

  if (req.user.role === 'farmer') {
    const farmerProfile = await FarmerProfile.findOne({ userId: req.user._id });
    if (!farmerProfile) {
      res.status(403);
      throw new Error('Farmer profile not found');
    }

    updatedFarmName = farmerProfile.farmName;

    // Find the sub-order belonging to this farmer
    const subOrder = order.farmerOrders?.find(
      (fo) => fo.farmerId?._id?.toString() === farmerProfile._id.toString() ||
              fo.farmerId?.toString() === farmerProfile._id.toString()
    );

    const isLegacyFarmer = order.farmerId?._id?.toString() === farmerProfile._id.toString();

    if (!subOrder && !isLegacyFarmer) {
      res.status(403);
      throw new Error('Not authorized to update another farmer’s order');
    }

    if (subOrder) {
      subOrder.farmerOrderStatus = status;
      if (status === 'Accepted') subOrder.acceptedAt = Date.now();
      if (status === 'Packed') subOrder.packedAt = Date.now();
      if (status === 'Out For Delivery') subOrder.outForDeliveryAt = Date.now();
      if (status === 'Delivered') subOrder.deliveredAt = Date.now();
      if (status === 'Cancelled') {
        subOrder.cancelledAt = Date.now();
        if (cancelReason) subOrder.cancelReason = cancelReason;
      }
    }

    // Recompute overall order status across all sub-orders
    if (order.farmerOrders && order.farmerOrders.length > 0) {
      const allStatuses = order.farmerOrders.map((so) => so.farmerOrderStatus);
      const allDelivered = allStatuses.every((s) => s === 'Delivered');
      const allCancelled = allStatuses.every((s) => s === 'Cancelled');

      if (allDelivered) {
        order.orderStatus = 'Delivered';
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Completed';
      } else if (allCancelled) {
        order.orderStatus = 'Cancelled';
        order.cancelledAt = Date.now();
        if (order.paymentStatus === 'Completed') order.paymentStatus = 'Refunded';
        else order.paymentStatus = 'Failed';
      } else if (allStatuses.some((s) => s === 'Delivered' || s === 'Out For Delivery')) {
        order.orderStatus = 'Out For Delivery';
      } else if (allStatuses.some((s) => s === 'Packed')) {
        order.orderStatus = 'Packed';
      } else if (allStatuses.some((s) => s === 'Accepted')) {
        order.orderStatus = 'Accepted';
      } else {
        order.orderStatus = 'Placed';
      }
    } else {
      order.orderStatus = status;
      if (status === 'Accepted') order.acceptedAt = Date.now();
      if (status === 'Packed') order.packedAt = Date.now();
      if (status === 'Out For Delivery') order.outForDeliveryAt = Date.now();
      if (status === 'Delivered') {
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Completed';
      }
      if (status === 'Cancelled') {
        order.cancelledAt = Date.now();
        if (cancelReason) order.cancelReason = cancelReason;
      }
    }
  } else if (req.user.role === 'admin') {
    // Admin can update a specific farmer's sub-order if farmerId provided, or the entire order
    if (farmerId && order.farmerOrders && order.farmerOrders.length > 0) {
      const subOrder = order.farmerOrders.find(
        (fo) => fo.farmerId?._id?.toString() === farmerId.toString() ||
                fo.farmerId?.toString() === farmerId.toString()
      );
      if (subOrder) {
        subOrder.farmerOrderStatus = status;
        if (status === 'Accepted') subOrder.acceptedAt = Date.now();
        if (status === 'Packed') subOrder.packedAt = Date.now();
        if (status === 'Out For Delivery') subOrder.outForDeliveryAt = Date.now();
        if (status === 'Delivered') subOrder.deliveredAt = Date.now();
        if (status === 'Cancelled') {
          subOrder.cancelledAt = Date.now();
          if (cancelReason) subOrder.cancelReason = cancelReason;
        }
      }
    } else {
      // Admin updating overall status also synchronizes all sub-orders
      order.orderStatus = status;
      if (status === 'Accepted') order.acceptedAt = Date.now();
      if (status === 'Packed') order.packedAt = Date.now();
      if (status === 'Out For Delivery') order.outForDeliveryAt = Date.now();
      if (status === 'Delivered') {
        order.deliveredAt = Date.now();
        order.paymentStatus = 'Completed';
      }
      if (status === 'Cancelled') {
        order.cancelledAt = Date.now();
        if (cancelReason) order.cancelReason = cancelReason;
        if (order.paymentStatus === 'Completed') order.paymentStatus = 'Refunded';
        else order.paymentStatus = 'Failed';
      }

      if (order.farmerOrders) {
        order.farmerOrders.forEach((so) => {
          so.farmerOrderStatus = status;
          if (status === 'Accepted') so.acceptedAt = Date.now();
          if (status === 'Packed') so.packedAt = Date.now();
          if (status === 'Out For Delivery') so.outForDeliveryAt = Date.now();
          if (status === 'Delivered') so.deliveredAt = Date.now();
          if (status === 'Cancelled') {
            so.cancelledAt = Date.now();
            if (cancelReason) so.cancelReason = cancelReason;
          }
        });
      }
    }
  }

  const updatedOrder = await order.save();

  // Keep Payments collection in sync
  await Payment.findOneAndUpdate(
    { orderId: updatedOrder._id },
    { paymentStatus: updatedOrder.paymentStatus },
    { upsert: true }
  );

  // Notify customer via Socket.io + persist notification
  const io = req.app.get('io');
  if (io && order.customerId) {
    const statusIcons = {
      Accepted: 'check-circle',
      Packed: 'package',
      'Out For Delivery': 'truck',
      Delivered: 'package-check',
      Cancelled: 'x-circle',
    };
    const statusColors = {
      Accepted: 'blue',
      Packed: 'indigo',
      'Out For Delivery': 'amber',
      Delivered: 'emerald',
      Cancelled: 'red',
    };

    await createNotification(io, {
      recipientId: order.customerId,
      type: 'order_status',
      title: `Order ${status}`,
      message: `${updatedFarmName} updated your order (${order.orderNumber}) status to: ${status}${cancelReason ? ` (Reason: ${cancelReason})` : ''}`,
      icon: statusIcons[status] || 'bell',
      color: statusColors[status] || 'blue',
      link: `/track-order?orderId=${order._id}`,
      referenceId: order._id,
    });

    // Notify admins about status change
    await notifyAllAdmins(io, {
      type: 'order_status',
      title: `Order Status: ${status}`,
      message: `Order ${order.orderNumber} updated to ${status} by ${updatedFarmName}.`,
      icon: statusIcons[status] || 'bell',
      color: statusColors[status] || 'blue',
      link: '/dashboard/admin?tab=orders',
      referenceId: order._id,
    });
  }

  res.json({ success: true, data: updatedOrder });
});

// @desc    Get logged in user orders (Customer)
// @route   GET /api/orders/myorders
// @access  Private/Customer
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id })
    .populate('farmerOrders.farmerId', 'farmName ownerName phone city')
    .populate('farmerId', 'farmName ownerName phone city')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: orders });
});

// @desc    Get farmer orders (Only returns this farmer's sub-orders & items)
// @route   GET /api/orders/farmer/all or /api/orders/farmer
// @access  Private/Farmer
const getFarmerOrders = asyncHandler(async (req, res) => {
  const farmerProfile = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmerProfile) {
    res.status(404);
    throw new Error('Farmer profile not found');
  }

  // Find orders where farmerOrders includes this farmer or legacy farmerId matches
  const orders = await Order.find({
    $or: [
      { 'farmerOrders.farmerId': farmerProfile._id },
      { farmerId: farmerProfile._id },
    ],
  })
    .populate('customerId', 'name email phone')
    .sort({ createdAt: -1 });

  // Map each order to return strictly this farmer's items, subtotal and status
  const farmerOrdersList = orders.map((order) => {
    const subOrder = order.farmerOrders?.find(
      (fo) => fo.farmerId.toString() === farmerProfile._id.toString()
    );

    if (subOrder) {
      return {
        _id: order._id,
        subOrderId: subOrder._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        deliveryAddress: order.deliveryAddress,
        receiverName: order.receiverName,
        receiverPhone: order.receiverPhone,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items: subOrder.items, // Only this farmer's items!
        totalAmount: subOrder.subtotal, // Only this farmer's subtotal!
        orderStatus: subOrder.farmerOrderStatus, // Only this farmer's status!
        cancelReason: subOrder.cancelReason,
        placedAt: subOrder.placedAt || order.placedAt,
        acceptedAt: subOrder.acceptedAt,
        packedAt: subOrder.packedAt,
        outForDeliveryAt: subOrder.outForDeliveryAt,
        deliveredAt: subOrder.deliveredAt,
        cancelledAt: subOrder.cancelledAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        isReviewed: order.isReviewed,
      };
    }

    // Fallback for legacy single-farmer order
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      deliveryAddress: order.deliveryAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      cancelReason: order.cancelReason,
      placedAt: order.placedAt,
      acceptedAt: order.acceptedAt,
      packedAt: order.packedAt,
      outForDeliveryAt: order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isReviewed: order.isReviewed,
    };
  });

  res.json({ success: true, count: farmerOrdersList.length, data: farmerOrdersList });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('customerId', 'name email phone')
    .populate('farmerOrders.farmerId', 'farmName ownerName phone city')
    .populate('farmerId', 'farmName ownerName phone city')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: orders.length, data: orders });
});

// @desc    Get all payments (Admin)
// @route   GET /api/orders/admin/payments
// @access  Private/Admin
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({})
    .populate({
      path: 'orderId',
      select: 'orderNumber customerId totalAmount',
      populate: { path: 'customerId', select: 'name email' },
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: payments.length, data: payments });
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getFarmerOrders,
  getAllOrders,
  getAllPayments,
};
