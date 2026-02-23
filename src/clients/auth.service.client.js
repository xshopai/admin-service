/**
 * Auth Service Client
 * Dual-mode client for communicating with the auth-service
 * Supports both HTTP and Dapr service invocation
 */

import { invokeService } from '../core/daprClient.js';
import logger from '../core/logger.js';

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
    
    // Note: auth-service might not be registered with service mesh yet
    // This is a temporary placeholder until auth-service is integrated
    logger.warn('Auth service client called but service may not be fully integrated', { email });
    
    return await invokeService(
      'auth-service',
      'api/auth/admin/password/reset',
      'POST',
      { email },
      { headers: getAuthHeaders(token) }
    );
  } catch (error) {
    logger.error('Failed to trigger admin password reset', {
      email,
      error: error.message,
    });
    throw error;
  }
}
