/**
 * Payment Service Client
 * HTTP client for communicating with the payment-service
 */

import axios from 'axios';
import config from '../core/config.js';
import logger from '../core/logger.js';

const PAYMENT_SERVICE_URL = config.services.payment;

/**
 * Create axios instance for payment service
 */
const paymentClient = axios.create({
  baseURL: PAYMENT_SERVICE_URL,
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
    const response = await paymentClient.get(`/api/payments/order/${orderId}`, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      logger.debug('No payment found for order', { orderId });
      return null; // No payment found for this order
    }
    if (error.response?.status === 401) {
      logger.warn('Unauthorized access to payment-service - JWT may be invalid or expired', {
        orderId,
        status: error.response?.status,
      });
      return null; // Return null instead of throwing to allow UI to show "not found"
    }
    logger.error('Failed to fetch payment from payment-service', {
      error: error.message,
      orderId,
      status: error.response?.status,
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
    const response = await paymentClient.get(`/api/payments/${paymentId}`, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch payment from payment-service', {
      error: error.message,
      paymentId,
      status: error.response?.status,
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
    const response = await paymentClient.get('/api/payments', {
      headers: getAuthHeaders(token),
      params: query,
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch payments from payment-service', {
      error: error.message,
      status: error.response?.status,
    });
    throw error;
  }
}
