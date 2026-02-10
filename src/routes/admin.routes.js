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
router.put('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

export default router;
