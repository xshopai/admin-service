/**
 * Payment Service Client
 * Dual-mode client for communicating with the payment-service
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
 * Fetch payment by order ID
 * @param {string} orderId - Order ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Payment object
 */
export async function fetchPaymentByOrderId(orderId, token) {
  try {
    logger.debug('Fetching payment from payment-service', {
      orderId,
      hasToken: !!token,
      tokenLength: token?.length,
    });
    return await invokeService('payment-service', `api/payments/order/${orderId}`, 'GET', null, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    if (error.message.includes('404')) {
      logger.debug('No payment found for order', { orderId });
      return null;
    }
    if (error.message.includes('401')) {
      logger.warn('Unauthorized access to payment-service - JWT may be invalid or expired', {
        orderId,
      });
      return null;
    }
    logger.error('Failed to fetch payment from payment-service', {
      error: error.message,
      orderId,
    });
    throw error;
  }
}

/**
 * Fetch payment by ID
 * @param {string} paymentId - Payment ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Payment object
 */
export async function fetchPaymentById(paymentId, token) {
  try {
    return await invokeService('payment-service', `api/payments/${paymentId}`, 'GET', null, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to fetch payment from payment-service', {
      error: error.message,
      paymentId,
    });
    throw error;
  }
}

/**
 * Fetch all payments with optional filtering
 * @param {string} token - JWT token
 * @param {Object} query - Query parameters (customerId, orderId, skip, take)
 * @returns {Promise<Array>} List of payments
 */
export async function fetchPayments(token, query = {}) {
  try {
    const queryString = new URLSearchParams(query).toString();
    const endpoint = queryString ? `api/payments?${queryString}` : 'api/payments';
    return await invokeService('payment-service', endpoint, 'GET', null, { headers: getAuthHeaders(token) });
  } catch (error) {
    logger.error('Failed to fetch payments from payment-service', {
      error: error.message,
    });
    throw error;
  }
}
