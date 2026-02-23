/**
 * User Service Client
 * Dual-mode client for communicating with the user-service
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
 * Fetch all users
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Users list
 */
export async function fetchAllUsers(token) {
  try {
    return await invokeService(
      'user-service',
      'api/admin/users',
      'GET',
      null,
      { headers: getAuthHeaders(token) }
    );
  } catch (error) {
    logger.error('Failed to fetch users from user-service', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Fetch user by ID
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User object
 */
export async function fetchUserById(userId, token) {
  try {
    return await invokeService(
      'user-service',
      `api/admin/users/${userId}`,
      'GET',
      null,
      { headers: getAuthHeaders(token) }
    );
  } catch (error) {
    logger.error('Failed to fetch user from user-service', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Update user by ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUserById(userId, updateData, token) {
  try {
    return await invokeService(
      'user-service',
      `api/admin/users/${userId}`,
      'PATCH',
      updateData,
      { headers: getAuthHeaders(token) }
    );
  } catch (error) {
    logger.error('Failed to update user in user-service', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Remove user by ID
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export async function removeUserById(userId, token) {
  try {
    return await invokeService(
      'user-service',
      `api/admin/users/${userId}`,
      'DELETE',
      null,
      { headers: getAuthHeaders(token) }
    );
  } catch (error) {
    logger.error('Failed to delete user from user-service', {
      error: error.message,
      userId,
    });
    throw error;
  }
}
