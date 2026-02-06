/**
 * Order Service Client
 * HTTP client for communicating with the order-service
 */

import axios from 'axios';
import config from '../core/config.js';
import logger from '../core/logger.js';

const ORDER_SERVICE_URL = config.services.order;

/**
 * Create axios instance for order service
 */
const orderClient = axios.create({
  baseURL: ORDER_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get authorization headers
 */
const getAuthHeaders = (token) => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

/**
 * Fetch all orders
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Orders list
 */
export async function fetchAllOrders(token) {
  try {
    const response = await orderClient.get('/api/admin/orders', {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch orders from order-service', {
      error: error.message,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Fetch paginated orders
 * @param {string} token - JWT token
 * @param {Object} query - Query parameters (page, pageSize, status, etc.)
 * @returns {Promise<Object>} Paginated orders
 */
export async function fetchOrdersPaged(token, query = {}) {
  try {
    const response = await orderClient.get('/api/admin/orders/paged', {
      headers: getAuthHeaders(token),
      params: query,
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch paged orders from order-service', {
      error: error.message,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Fetch order by ID
 * @param {string} orderId - Order ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Order object
 */
export async function fetchOrderById(orderId, token) {
  try {
    const response = await orderClient.get(`/api/admin/orders/${orderId}`, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch order from order-service', {
      error: error.message,
      orderId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {Object} statusData - Status update data
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Updated order object
 */
export async function updateOrderStatus(orderId, statusData, token) {
  try {
    const response = await orderClient.put(`/api/admin/orders/${orderId}/status`, statusData, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to update order status in order-service', {
      error: error.message,
      orderId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Delete order by ID
 * @param {string} orderId - Order ID
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export async function deleteOrderById(orderId, token) {
  try {
    await orderClient.delete(`/api/admin/orders/${orderId}`, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to delete order from order-service', {
      error: error.message,
      orderId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Fetch order statistics
 * @param {string} token - JWT token
 * @param {Object} options - Options (includeRecent, recentLimit)
 * @returns {Promise<Object>} Order statistics
 */
export async function fetchOrderStats(token, options = {}) {
  try {
    const response = await orderClient.get('/api/admin/orders/stats', {
      headers: getAuthHeaders(token),
      params: options,
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch order stats from order-service', {
      error: error.message,
      status: error.response?.status,
    });
    throw error;
  }
}
