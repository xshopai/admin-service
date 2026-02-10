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
