/**
 * User Service Client
 * HTTP client for communicating with the user-service
 */

import axios from 'axios';
import config from '../core/config.js';
import logger from '../core/logger.js';

const USER_SERVICE_URL = config.services.user;

/**
 * Create axios instance for user service
 */
const userClient = axios.create({
  baseURL: USER_SERVICE_URL,
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
 * Fetch all users
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Users list
 */
export async function fetchAllUsers(token) {
  try {
    const response = await userClient.get('/api/admin/users', {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch users from user-service', {
      error: error.message,
      status: error.response?.status,
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
    const response = await userClient.get(`/api/admin/users/${userId}`, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user from user-service', {
      error: error.message,
      userId,
      status: error.response?.status,
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
    const response = await userClient.patch(`/api/admin/users/${userId}`, updateData, {
      headers: getAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    logger.error('Failed to update user in user-service', {
      error: error.message,
      userId,
      status: error.response?.status,
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
    await userClient.delete(`/api/admin/users/${userId}`, {
      headers: getAuthHeaders(token),
    });
  } catch (error) {
    logger.error('Failed to delete user from user-service', {
      error: error.message,
      userId,
      status: error.response?.status,
    });
    throw error;
  }
}
