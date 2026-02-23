/**
 * Order Service Client
 * Dual-mode client for communicating with the order-service
 * Supports both HTTP and Dapr service invocation
 */

import { invokeService } from '../core/daprClient.js';
import logger from '../core/logger.js';

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
    return await invokeService('order-service', 'api/admin/orders', 'GET', null, { headers: getAuthHeaders(token) });
  } catch (error) {
    logger.error('Failed to fetch orders from order-service', {
      error: error.message,
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
    const queryString = new URLSearchParams(query).toString();
    const endpoint = queryString ? `api/admin/orders/paged?${queryString}` : 'api/admin/orders/paged';
    return await invokeService('order-service', endpoint, 'GET', null, { headers: getAuthHeaders(token) });
  } catch (error) {
    logger.error('Failed to fetch paged orders from order-service', {
      error: error.message,
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
    return await invokeService('order-service', `api/admin/orders/${orderId}`, 'GET', null, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to fetch order from order-service', {
      error: error.message,
      orderId,
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
    return await invokeService('order-service', `api/admin/orders/${orderId}/status`, 'PUT', statusData, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to update order status in order-service', {
      error: error.message,
      orderId,
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
    return await invokeService('order-service', `api/admin/orders/${orderId}`, 'DELETE', null, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to delete order from order-service', {
      error: error.message,
      orderId,
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
    const queryString = new URLSearchParams(options).toString();
    const endpoint = queryString ? `api/admin/orders/stats?${queryString}` : 'api/admin/orders/stats';
    return await invokeService('order-service', endpoint, 'GET', null, { headers: getAuthHeaders(token) });
  } catch (error) {
    logger.error('Failed to fetch order stats from order-service', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Fetch order tracking info with timeline
 * @param {string} orderId - Order ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Tracking info with timeline
 */
export async function fetchOrderTracking(orderId, token) {
  try {
    return await invokeService('order-service', `api/admin/orders/${orderId}/tracking`, 'GET', null, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to fetch order tracking from order-service', {
      error: error.message,
      orderId,
    });
    throw error;
  }
}
