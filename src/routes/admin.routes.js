import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAllOrders,
  getOrdersPaged,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  getOrderTracking,
  getOrderPayment,
  confirmOrderPayment,
  failOrderPayment,
  getAllReturns,
  getReturnsPaged,
  getReturnsStats,
  getReturnById,
  updateReturnStatus,
} from '../controllers/admin.controller.js';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT, requireRoles('admin'));

// User routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);

// Order routes
router.get('/orders/stats', getOrderStats); // Must be before /orders/:id
router.get('/orders/paged', getOrdersPaged);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);
router.get('/orders/:id/tracking', getOrderTracking);
router.put('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

// Payment management routes (for admin-driven workflow)
router.get('/orders/:id/payment', getOrderPayment);
router.post('/orders/:id/confirm-payment', confirmOrderPayment);
router.post('/orders/:id/fail-payment', failOrderPayment);

// Returns routes (stub - not yet implemented)
router.get('/returns/stats', getReturnsStats); // Must be before /returns/:id
router.get('/returns/paged', getReturnsPaged);
router.get('/returns', getAllReturns);
router.get('/returns/:id', getReturnById);
router.put('/returns/:id/status', updateReturnStatus);

export default router;
