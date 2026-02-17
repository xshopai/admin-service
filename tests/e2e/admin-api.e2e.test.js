// API Test: Admin Service
// Tests individual admin-service endpoints in isolation
//
// Dependencies:
// - auth-service: For creating admin users and JWT tokens
// - user-service: Admin-service calls user-service for user management
// - message-broker-service: For publishing admin action events
// Note: Admin endpoints require authentication with admin role

import axios from 'axios';
import { generateTestUser, createUser, deleteUser, sleep } from '../../shared/helpers/user.js';
import { registerUser, login } from '../../shared/helpers/auth.js';

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:8003';
const ADMIN_SERVICE_HEALTH_URL = process.env.ADMIN_SERVICE_HEALTH_URL || 'http://localhost:8003/health/ready';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8004';
const AUTH_SERVICE_HEALTH_URL = process.env.AUTH_SERVICE_HEALTH_URL || 'http://localhost:8004/health/ready';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8002';
const USER_SERVICE_HEALTH_URL = process.env.USER_SERVICE_HEALTH_URL || 'http://localhost:8002/health/ready';

// Verify required services are available
async function verifyServices() {
  try {
    await axios.get(ADMIN_SERVICE_HEALTH_URL, { timeout: 2000 });
    await axios.get(AUTH_SERVICE_HEALTH_URL, { timeout: 2000 });
    await axios.get(USER_SERVICE_HEALTH_URL, { timeout: 2000 });
    return true;
  } catch (error) {
    console.error('❌ Required services not available:');
    console.error(`   Admin Service: ${ADMIN_SERVICE_URL}`);
    console.error(`   Auth Service: ${AUTH_SERVICE_URL}`);
    console.error(`   User Service: ${USER_SERVICE_URL}`);
    console.error('   Please start all required services before running tests.');
    return false;
  }
}

describe('Admin Service API Tests', () => {
  let adminToken;
  let testUserId;
  let regularUserToken;

  beforeAll(async () => {
    const servicesAvailable = await verifyServices();
    if (!servicesAvailable) {
      throw new Error('Required services are not available');
    }

    // Create an admin user directly through user-service (bypassing email verification)
    // In real scenarios, admin users would be created through a separate admin provisioning process
    const adminUser = generateTestUser();
    adminUser.email = `admin-${Date.now()}@test.com`;
    adminUser.roles = ['admin', 'customer'];
    adminUser.isEmailVerified = true; // Bypass email verification for tests

    try {
      // Create verified admin user via user-service
      const createdUser = await createUser(adminUser);

      // Now login via auth-service (will work since email is verified)
      const loginResponse = await login(adminUser.email, adminUser.password);
      adminToken = loginResponse.data.jwt; // auth-service returns 'jwt' not 'token'
      console.log('✅ Created admin test user');
    } catch (error) {
      console.error('Failed to create admin user:', error.message);
      throw error;
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(ADMIN_SERVICE_HEALTH_URL);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('healthy');
      expect(response.data.service).toBe('admin-service');

      console.log('✅ Admin service is healthy');
    });
  });

  describe('User Management - Get All Users', () => {
    it('should return list of users for admin', async () => {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      console.log(`✅ Retrieved ${response.data.length} users`);
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users`);
        fail('Should have thrown unauthorized error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);

        console.log('✅ Rejected unauthenticated request');
      }
    });
  });

  describe('User Management - Get User By ID', () => {
    beforeAll(async () => {
      // Create a test user to retrieve
      const testUser = generateTestUser();
      const created = await createUser(testUser);
      testUserId = created._id || created.id;
    });

    it('should return user details for valid ID', async () => {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBeDefined();

      console.log('✅ Retrieved user by ID');
    });

    it('should reject invalid user ID format', async () => {
      try {
        await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users/invalid-id`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid user ID');

        console.log('✅ Rejected invalid user ID format');
      }
    });

    it('should return 404 for non-existent user ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but doesn't exist

      try {
        await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users/${fakeId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        fail('Should have thrown not found error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(404);

        console.log('✅ Returned 404 for non-existent user');
      }
    });
  });

  describe('User Management - Update User', () => {
    let updateTestUserId;

    beforeAll(async () => {
      // Create a test user to update
      const testUser = generateTestUser();
      const created = await createUser(testUser);
      updateTestUserId = created._id || created.id;
    });

    it('should update user profile information', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await axios.patch(`${ADMIN_SERVICE_URL}/api/admin/users/${updateTestUserId}`, updates, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.firstName).toBe('Updated');
      expect(response.data.lastName).toBe('Name');

      console.log('✅ Updated user profile');
    });

    it('should reject invalid email format', async () => {
      const updates = {
        email: 'invalid-email',
      };

      try {
        await axios.patch(`${ADMIN_SERVICE_URL}/api/admin/users/${updateTestUserId}`, updates, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid email');

        console.log('✅ Rejected invalid email format');
      }
    });

    it('should reject weak password', async () => {
      const updates = {
        password: '123',
      };

      try {
        await axios.patch(`${ADMIN_SERVICE_URL}/api/admin/users/${updateTestUserId}`, updates, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid password');

        console.log('✅ Rejected weak password');
      }
    });

    it('should reject invalid user ID format', async () => {
      const updates = { firstName: 'Test' };

      try {
        await axios.patch(`${ADMIN_SERVICE_URL}/api/admin/users/invalid-id`, updates, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid user ID');

        console.log('✅ Rejected invalid user ID for update');
      }
    });
  });

  describe('User Management - Delete User', () => {
    let deleteTestUserId;

    beforeEach(async () => {
      // Create a test user to delete
      const testUser = generateTestUser();
      const created = await createUser(testUser);
      deleteTestUserId = created._id || created.id;
    });

    it('should delete user by ID', async () => {
      const response = await axios.delete(`${ADMIN_SERVICE_URL}/api/admin/users/${deleteTestUserId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(204);

      console.log('✅ Deleted user successfully');
    });

    it('should reject invalid user ID format', async () => {
      try {
        await axios.delete(`${ADMIN_SERVICE_URL}/api/admin/users/invalid-id`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid user ID');

        console.log('✅ Rejected invalid user ID for deletion');
      }
    });

    it('should reject deletion without authentication', async () => {
      try {
        await axios.delete(`${ADMIN_SERVICE_URL}/api/admin/users/${deleteTestUserId}`);
        fail('Should have thrown unauthorized error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);

        console.log('✅ Rejected unauthenticated deletion');
      }
    });
  });
});
