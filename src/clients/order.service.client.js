import { DaprClient, HttpMethod } from '@dapr/dapr';
import logger from '../core/logger.js';

const daprHost = process.env.DAPR_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500'; // admin-service's Dapr HTTP port
const ORDER_SERVICE_APP_ID = 'order-service';

const daprClient = new DaprClient({ daprHost, daprPort });

/**
 * Fetch all orders from order-service
 */
export async function fetchAllOrders(token) {
  try {
    const response = await daprClient.invoker.invoke(ORDER_SERVICE_APP_ID, '/api/admin/orders', HttpMethod.GET, null, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response;
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
    const response = await daprClient.invoker.invoke(
      ORDER_SERVICE_APP_ID,
      `/api/admin/orders/paged${queryString}`,
      HttpMethod.GET,
      null,
      { headers: { authorization: `Bearer ${token}` } },
    );
    return response;
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
    const response = await daprClient.invoker.invoke(
      ORDER_SERVICE_APP_ID,
      `/api/admin/orders/${orderId}`,
      HttpMethod.GET,
      null,
      { headers: { authorization: `Bearer ${token}` } },
    );
    return response;
  } catch (error) {
    logger.error('Failed to fetch order by ID from order-service', {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Update order status in order-service
 */
export async function updateOrderStatus(orderId, data, token) {
  try {
    const response = await daprClient.invoker.invoke(
      ORDER_SERVICE_APP_ID,
      `/api/admin/orders/${orderId}/status`,
      HttpMethod.PUT,
      data,
      { headers: { authorization: `Bearer ${token}` } },
    );
    return response;
  } catch (error) {
    logger.error('Failed to update order status in order-service', {
      orderId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Delete order from order-service
 */
export async function deleteOrderById(orderId, token) {
  try {
    await daprClient.invoker.invoke(ORDER_SERVICE_APP_ID, `/api/admin/orders/${orderId}`, HttpMethod.DELETE, null, {
      headers: { authorization: `Bearer ${token}` },
    });
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

    const response = await daprClient.invoker.invoke(ORDER_SERVICE_APP_ID, endpoint, HttpMethod.GET, null, {
      headers: { authorization: `Bearer ${token}` },
    });
    return response;
  } catch (error) {
    logger.error('Failed to fetch order stats from order-service', { error: error.message });
    throw error;
  }
}
