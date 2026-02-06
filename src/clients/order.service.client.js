import logger from '../core/logger.js';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://xshopai-order-service:8006';

/**
 * Make HTTP request to order-service
 */
async function callOrderService(endpoint, method, token, data = null) {
  const url = `${ORDER_SERVICE_URL}${endpoint}`;
  const options = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  if (data && method.toUpperCase() !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return null;
}

/**
 * Fetch all orders from order-service
 */
export async function fetchAllOrders(token) {
  try {
    return await callOrderService('/api/admin/orders', 'GET', token);
  } catch (error) {
    logger.error('Failed to fetch all orders from order-service', { error: error.message });
    throw error;
  }
}

/**
 * Fetch paginated orders from order-service
 */
export async function fetchOrdersPaged(token, queryParams) {
  try {
    const queryString = queryParams ? '?' + new URLSearchParams(queryParams).toString() : '';
    return await callOrderService(`/api/admin/orders/paged${queryString}`, 'GET', token);
  } catch (error) {
    logger.error('Failed to fetch paged orders from order-service', { error: error.message });
    throw error;
  }
}

/**
 * Fetch order by ID from order-service
 */
export async function fetchOrderById(orderId, token) {
  try {
    return await callOrderService(`/api/admin/orders/${orderId}`, 'GET', token);
  } catch (error) {
    logger.error('Failed to fetch order by ID from order-service', { orderId, error: error.message });
    throw error;
  }
}

/**
 * Update order status in order-service
 */
export async function updateOrderStatus(orderId, data, token) {
  try {
    return await callOrderService(`/api/admin/orders/${orderId}/status`, 'PUT', token, data);
  } catch (error) {
    logger.error('Failed to update order status in order-service', { orderId, error: error.message });
    throw error;
  }
}

/**
 * Delete order from order-service
 */
export async function deleteOrderById(orderId, token) {
  try {
    await callOrderService(`/api/admin/orders/${orderId}`, 'DELETE', token);
  } catch (error) {
    logger.error('Failed to delete order from order-service', { orderId, error: error.message });
    throw error;
  }
}

/**
 * Fetch order statistics from order-service
 */
export async function fetchOrderStats(token, options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.includeRecent) params.append('includeRecent', 'true');
    if (options.recentLimit) params.append('recentLimit', options.recentLimit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/admin/orders/stats?${queryString}` : '/api/admin/orders/stats';

    return await callOrderService(endpoint, 'GET', token);
  } catch (error) {
    logger.error('Failed to fetch order stats from order-service', { error: error.message });
    throw error;
  }
}
