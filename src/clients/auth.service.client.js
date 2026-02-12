import axios from 'axios';
import logger from '../core/logger.js';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8004/api/auth';

/**
 * Create axios instance for auth-service
 */
const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Helper to get authorization headers
 * @param {string} token - JWT token
 * @returns {object} Headers object
 */
function getAuthHeaders(token) {
  if (!token) {
    throw new Error('Authorization token is required');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Trigger admin password reset for a user
 * @param {string} email - User email
 * @param {string} token - Admin JWT token
 * @returns {Promise<object>} Response data
 */
export async function triggerPasswordReset(email, token) {
  try {
    logger.info('Triggering admin password reset', { email });
    const response = await authClient.post(
      '/admin/password/reset',
      { email },
      {
        headers: getAuthHeaders(token),
      },
    );
    logger.info('Admin password reset triggered successfully', { email });
    return response.data;
  } catch (error) {
    logger.error('Failed to trigger admin password reset', {
      email,
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
    throw error;
  }
}
