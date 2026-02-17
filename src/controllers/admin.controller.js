import logger from '../core/logger.js';
import asyncHandler from '../middlewares/async.handler.js';
import { fetchAllUsers, fetchUserById, updateUserById, removeUserById } from '../clients/user.service.client.js';
import {
  fetchAllOrders,
  fetchOrdersPaged,
  fetchOrderById,
  updateOrderStatus as updateOrderStatusInService,
  deleteOrderById,
  fetchOrderStats,
} from '../clients/order.service.client.js';
import { triggerPasswordReset } from '../clients/auth.service.client.js';
import { fetchPaymentByOrderId } from '../clients/payment.service.client.js';
import { getMessagingProvider } from '../messaging/index.js';
import adminValidator from '../validators/admin.validator.js';

// ============================================================================
// User Management
// ============================================================================

/**
 * @desc    Get all users
 * @route   GET /admin/users
 * @access  Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  logger.info('Admin requested all users', { actorId: req.user?._id });
  const users = await fetchAllUsers(req.headers.authorization?.split(' ')[1]);
  res.json(users);
});

/**
 * @desc    Get user by ID
 * @route   GET /admin/users/:id
 * @access  Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  if (!adminValidator.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  logger.info('Admin requested user by id', { actorId: req.user?._id, targetId: req.params.id });
  const user = await fetchUserById(req.params.id, req.headers.authorization?.split(' ')[1]);
  res.json(user);
});

/**
 * @desc    Update user by ID (profile, password, activate/deactivate)
 * @route   PATCH /admin/users/:id
 * @access  Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  if (!adminValidator.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (!adminValidator.isValidUpdatePayload(req.body)) {
    return res.status(400).json({ error: 'Invalid update payload' });
  }
  if ('roles' in req.body && !adminValidator.isValidRoles(req.body.roles)) {
    return res.status(400).json({ error: 'Invalid roles' });
  }
  if ('isActive' in req.body && !adminValidator.isValidIsActive(req.body.isActive)) {
    return res.status(400).json({ error: 'Invalid isActive value' });
  }
  if ('email' in req.body && !adminValidator.isValidEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if ('password' in req.body && !adminValidator.isValidPassword(req.body.password)) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  logger.info('Admin updating user', { actorId: req.user?.id, targetId: req.params.id });
  // Send all updatable fields (profile, password, isActive, etc.)
  const updated = await updateUserById(req.params.id, req.body, req.headers.authorization?.split(' ')[1]);
  res.json(updated);
});

/**
 * @desc    Delete user by ID
 * @route   DELETE /admin/users/:id
 * @access  Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  if (!adminValidator.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  // Prevent admin from deleting himself
  if (req.user && req.user.id && req.user.id.toString() === req.params.id) {
    logger.warn('Admin attempted to delete himself', { actorId: req.user.id });
    return res.status(403).json({ error: 'Admins cannot delete their own account.' });
  }
  logger.info('Admin deleting user', { actorId: req.user?.id, targetId: req.params.id });
  await removeUserById(req.params.id, req.headers.authorization?.split(' ')[1]);
  res.status(204).send();
});

/**
 * @desc    Trigger password reset for a user (admin action)
 * @route   POST /admin/users/:id/reset-password
 * @access  Admin
 */
export const resetUserPassword = asyncHandler(async (req, res) => {
  if (!adminValidator.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Get user email from request body (admin must provide email)
  const { email } = req.body;

  if (!email || !adminValidator.isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  logger.info('Admin triggering password reset', {
    actorId: req.user?.id,
    targetId: req.params.id,
    email,
  });

  try {
    const result = await triggerPasswordReset(email, req.headers.authorization?.split(' ')[1]);
    res.json(result);
  } catch (error) {
    logger.error('Failed to trigger password reset', {
      actorId: req.user?.id,
      targetId: req.params.id,
      email,
      error: error.response?.data || error.message,
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to trigger password reset',
    });
  }
});

// ============================================================================
// Order Management
// ============================================================================

/**
 * @desc    Get all orders
 * @route   GET /admin/orders
 * @access  Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  logger.info('Admin requested all orders', { actorId: req.user?._id });
  const orders = await fetchAllOrders(req.headers.authorization?.split(' ')[1]);
  res.json(orders);
});

/**
 * @desc    Get paginated orders
 * @route   GET /admin/orders/paged
 * @access  Admin
 */
export const getOrdersPaged = asyncHandler(async (req, res) => {
  logger.info('Admin requested paged orders', { actorId: req.user?._id, query: req.query });
  const orders = await fetchOrdersPaged(req.headers.authorization?.split(' ')[1], req.query);
  res.json(orders);
});

/**
 * @desc    Get order by ID
 * @route   GET /admin/orders/:id
 * @access  Admin
 */
export const getOrderById = asyncHandler(async (req, res) => {
  logger.info('Admin requested order by id', { actorId: req.user?._id, orderId: req.params.id });
  const order = await fetchOrderById(req.params.id, req.headers.authorization?.split(' ')[1]);
  res.json(order);
});

/**
 * @desc    Update order status
 * @route   PUT /admin/orders/:id/status
 * @access  Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  logger.info('Admin updating order status', { actorId: req.user?.id, orderId: req.params.id });
  const updated = await updateOrderStatusInService(req.params.id, req.body, req.headers.authorization?.split(' ')[1]);
  res.json(updated);
});

/**
 * @desc    Delete order by ID
 * @route   DELETE /admin/orders/:id
 * @access  Admin
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  logger.info('Admin deleting order', { actorId: req.user?.id, orderId: req.params.id });
  await deleteOrderById(req.params.id, req.headers.authorization?.split(' ')[1]);
  res.status(204).send();
});

/**
 * @desc    Get order statistics
 * @route   GET /admin/orders/stats
 * @access  Admin
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const includeRecent = req.query.includeRecent === 'true';
  const recentLimit = parseInt(req.query.recentLimit) || 10;

  logger.info('Admin requested order stats', {
    actorId: req.user?._id,
    includeRecent,
    recentLimit,
  });

  const stats = await fetchOrderStats(req.headers.authorization?.split(' ')[1], {
    includeRecent,
    recentLimit,
  });
  res.json(stats);
});

// ============================================================================
// Returns Management (Stub - Not Yet Implemented)
// ============================================================================

/**
 * @desc    Get all returns (stub)
 * @route   GET /admin/returns
 * @access  Admin
 */
export const getAllReturns = asyncHandler(async (req, res) => {
  logger.info('Admin requested all returns (stub)', { actorId: req.user?._id });
  res.json({
    success: true,
    data: [],
    message: 'Returns management not yet implemented',
  });
});

/**
 * @desc    Get returns with pagination (stub)
 * @route   GET /admin/returns/paged
 * @access  Admin
 */
export const getReturnsPaged = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  logger.info('Admin requested paged returns (stub)', {
    actorId: req.user?._id,
    page,
    pageSize,
  });

  res.json({
    success: true,
    data: [],
    pagination: {
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0,
    },
    message: 'Returns management not yet implemented',
  });
});

/**
 * @desc    Get return statistics (stub)
 * @route   GET /admin/returns/stats
 * @access  Admin
 */
export const getReturnsStats = asyncHandler(async (req, res) => {
  logger.info('Admin requested returns stats (stub)', { actorId: req.user?._id });
  res.json({
    success: true,
    data: {
      total: 0,
      requested: 0,
      approved: 0,
      rejected: 0,
      refundProcessed: 0,
    },
    message: 'Returns management not yet implemented',
  });
});

/**
 * @desc    Get return by ID (stub)
 * @route   GET /admin/returns/:id
 * @access  Admin
 */
export const getReturnById = asyncHandler(async (req, res) => {
  logger.info('Admin requested return by id (stub)', {
    actorId: req.user?._id,
    returnId: req.params.id,
  });
  res.status(404).json({
    success: false,
    error: 'Returns management not yet implemented',
  });
});

/**
 * @desc    Update return status (stub)
 * @route   PUT /admin/returns/:id/status
 * @access  Admin
 */
export const updateReturnStatus = asyncHandler(async (req, res) => {
  logger.info('Admin updating return status (stub)', {
    actorId: req.user?._id,
    returnId: req.params.id,
    status: req.body.status,
  });
  res.status(501).json({
    success: false,
    error: 'Returns management not yet implemented',
  });
});

// ============================================================================
// Payment Management
// ============================================================================

/**
 * @desc    Get payment for an order
 * @route   GET /admin/orders/:id/payment
 * @access  Admin
 *
 * Fetches payment details from payment-service for the given order.
 * Used by admin to verify payment before confirming.
 */
export const getOrderPayment = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  logger.info('Admin requested payment for order', {
    actorId: req.user?._id,
    orderId,
  });

  const payment = await fetchPaymentByOrderId(orderId, req.headers.authorization?.split(' ')[1]);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'No payment found for this order',
      orderId,
    });
  }

  res.json({
    success: true,
    data: payment,
  });
});

/**
 * @desc    Confirm payment for an order (Admin action)
 * @route   POST /admin/orders/:id/confirm-payment
 * @access  Admin
 *
 * Admin confirms that payment has been received and verified.
 * This publishes a payment.processed event to advance the order saga.
 */
export const confirmOrderPayment = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const adminId = req.user?._id || req.user?.id;
  const correlationId = req.headers['x-correlation-id'] || `admin-${Date.now()}`;

  logger.info('Admin confirming payment for order', {
    actorId: adminId,
    orderId,
    correlationId,
  });

  // First, verify payment exists
  const payment = await fetchPaymentByOrderId(orderId, req.headers.authorization?.split(' ')[1]);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: 'No payment found for this order. Cannot confirm.',
      orderId,
    });
  }

  // Check payment status - should be succeeded or processing
  const status = (payment.status || '').toLowerCase();
  if (status !== 'succeeded' && status !== 'processing') {
    return res.status(400).json({
      success: false,
      error: `Cannot confirm payment with status: ${payment.status}`,
      orderId,
      paymentId: payment.id,
      paymentStatus: payment.status,
    });
  }

  // Publish payment.processed event to advance the saga
  const eventPayload = {
    orderId: orderId,
    paymentId: payment.id?.toString() || payment.paymentId,
    amount: payment.amount,
    currency: payment.currency || 'USD',
    correlationId: correlationId,
    processedAt: new Date().toISOString(),
    confirmedBy: adminId,
    confirmationSource: 'admin-ui',
  };

  try {
    const messaging = await getMessagingProvider();
    await messaging.publishEvent('payment.processed', eventPayload, correlationId);

    logger.info('Published payment.processed event', {
      orderId,
      paymentId: payment.id,
      correlationId,
      confirmedBy: adminId,
    });

    res.json({
      success: true,
      message: 'Payment confirmed. Order saga will advance to shipping preparation.',
      data: {
        orderId,
        paymentId: payment.id,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: adminId,
      },
    });
  } catch (error) {
    logger.error('Failed to publish payment.processed event', {
      orderId,
      error: error.message,
      correlationId,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to confirm payment. Event publishing failed.',
      details: error.message,
    });
  }
});

/**
 * @desc    Mark payment as failed (Admin action)
 * @route   POST /admin/orders/:id/fail-payment
 * @access  Admin
 *
 * Admin marks payment as failed/rejected.
 * This publishes a payment.failed event to trigger saga compensation.
 */
export const failOrderPayment = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const adminId = req.user?._id || req.user?.id;
  const correlationId = req.headers['x-correlation-id'] || `admin-${Date.now()}`;
  const reason = req.body.reason || 'Payment rejected by admin';

  logger.info('Admin marking payment as failed for order', {
    actorId: adminId,
    orderId,
    reason,
    correlationId,
  });

  // Publish payment.failed event to trigger saga compensation
  const eventPayload = {
    orderId: orderId,
    reason: reason,
    correlationId: correlationId,
    failedAt: new Date().toISOString(),
    failedBy: adminId,
    failureSource: 'admin-ui',
  };

  try {
    const messaging = await getMessagingProvider();
    await messaging.publishEvent('payment.failed', eventPayload, correlationId);

    logger.info('Published payment.failed event', {
      orderId,
      reason,
      correlationId,
      failedBy: adminId,
    });

    res.json({
      success: true,
      message: 'Payment marked as failed. Order saga will initiate compensation.',
      data: {
        orderId,
        status: 'failed',
        reason,
        failedAt: new Date().toISOString(),
        failedBy: adminId,
      },
    });
  } catch (error) {
    logger.error('Failed to publish payment.failed event', {
      orderId,
      error: error.message,
      correlationId,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to mark payment as failed. Event publishing failed.',
      details: error.message,
    });
  }
});
