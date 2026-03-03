/**
 * Unit Tests: admin.controller.js
 *
 * Tests controller logic in isolation — all service clients and external
 * dependencies are mocked. A minimal Express app is assembled per-suite
 * so each test exercises only the controller + validator logic.
 */

import express from 'express';
import request from 'supertest';

// ── Mock all external dependencies before importing the controller ──────────
jest.mock('../../src/clients/user.service.client.js');
jest.mock('../../src/clients/order.service.client.js');
jest.mock('../../src/clients/auth.service.client.js');
jest.mock('../../src/clients/payment.service.client.js');
jest.mock('../../src/messaging/index.js');
jest.mock('../../src/core/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { fetchAllUsers, fetchUserById, updateUserById, removeUserById } from '../../src/clients/user.service.client.js';

import { getAllUsers, getUserById, updateUser, deleteUser } from '../../src/controllers/admin.controller.js';
import errorHandler from '../../src/middlewares/errorHandler.middleware.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const ANOTHER_VALID_ID = '507f1f77bcf86cd799439022';
const ADMIN_USER_ID = '507f1f77bcf86cd799439099';

/**
 * Build a minimal Express app mounting the supplied route handlers.
 * Sets req.user and Authorization header so controller logic sees an admin.
 */
function buildApp({ userId = ADMIN_USER_ID } = {}) {
  const app = express();
  app.use(express.json());

  // Simulate the auth middleware: attach user + forward token
  app.use((req, _res, next) => {
    req.user = { id: userId, _id: userId, role: 'admin' };
    if (!req.headers.authorization) {
      req.headers.authorization = 'Bearer test-token';
    }
    next();
  });

  app.get('/api/admin/users', getAllUsers);
  app.get('/api/admin/users/:id', getUserById);
  app.patch('/api/admin/users/:id', updateUser);
  app.delete('/api/admin/users/:id', deleteUser);

  // Centralized error handler — mirrors production setup
  app.use(errorHandler);

  return app;
}

// ── getAllUsers ───────────────────────────────────────────────────────────────

describe('getAllUsers', () => {
  const app = buildApp();

  afterEach(() => jest.clearAllMocks());

  it('returns the user list from user-service', async () => {
    const mockUsers = [{ id: VALID_OBJECT_ID, email: 'a@example.com' }];
    fetchAllUsers.mockResolvedValue(mockUsers);

    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUsers);
    expect(fetchAllUsers).toHaveBeenCalledWith('test-token');
  });

  it('propagates upstream error status', async () => {
    const err = Object.assign(new Error('service down'), { status: 503, response: { status: 503 } });
    fetchAllUsers.mockRejectedValue(err);

    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(503);
  });
});

// ── getUserById ───────────────────────────────────────────────────────────────

describe('getUserById', () => {
  const app = buildApp();

  afterEach(() => jest.clearAllMocks());

  it('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/admin/users/not-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid user id/i);
    expect(fetchUserById).not.toHaveBeenCalled();
  });

  it('returns user data for a valid ObjectId', async () => {
    const mockUser = { id: VALID_OBJECT_ID, email: 'user@example.com' };
    fetchUserById.mockResolvedValue(mockUser);

    const res = await request(app).get(`/api/admin/users/${VALID_OBJECT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUser);
    expect(fetchUserById).toHaveBeenCalledWith(VALID_OBJECT_ID, 'test-token');
  });

  it('propagates 404 when user-service returns not found', async () => {
    const err = Object.assign(new Error('not found'), { status: 404, response: { status: 404 } });
    fetchUserById.mockRejectedValue(err);

    const res = await request(app).get(`/api/admin/users/${VALID_OBJECT_ID}`);

    expect(res.status).toBe(404);
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  const app = buildApp();

  afterEach(() => jest.clearAllMocks());

  it('returns 400 for an invalid ObjectId in the path', async () => {
    const res = await request(app).patch('/api/admin/users/bad-id').send({ firstName: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid user id/i);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('returns 400 for a payload containing disallowed fields', async () => {
    const res = await request(app).patch(`/api/admin/users/${VALID_OBJECT_ID}`).send({ foo: 'bar' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid update payload/i);
  });

  it('returns 400 for an invalid email format', async () => {
    const res = await request(app).patch(`/api/admin/users/${VALID_OBJECT_ID}`).send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid email/i);
  });

  it('returns 400 for a weak password', async () => {
    const res = await request(app).patch(`/api/admin/users/${VALID_OBJECT_ID}`).send({ password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid password/i);
  });

  it('returns 400 for invalid roles', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${VALID_OBJECT_ID}`)
      .send({ roles: ['superadmin'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid roles/i);
  });

  it('returns 400 for non-boolean isActive', async () => {
    const res = await request(app).patch(`/api/admin/users/${VALID_OBJECT_ID}`).send({ isActive: 'yes' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid isactive/i);
  });

  it('calls updateUserById and returns the updated user for valid data', async () => {
    const mockUpdated = { id: VALID_OBJECT_ID, firstName: 'Updated' };
    updateUserById.mockResolvedValue(mockUpdated);

    const res = await request(app).patch(`/api/admin/users/${VALID_OBJECT_ID}`).send({ firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockUpdated);
    expect(updateUserById).toHaveBeenCalledWith(VALID_OBJECT_ID, { firstName: 'Updated' }, 'test-token');
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 400 for an invalid ObjectId', async () => {
    const app = buildApp();
    const res = await request(app).delete('/api/admin/users/bad-id');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid user id/i);
    expect(removeUserById).not.toHaveBeenCalled();
  });

  it('returns 403 when admin tries to delete their own account', async () => {
    // Build app where the authenticated admin's ID matches the target
    const app = buildApp({ userId: VALID_OBJECT_ID });

    const res = await request(app).delete(`/api/admin/users/${VALID_OBJECT_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot delete their own/i);
    expect(removeUserById).not.toHaveBeenCalled();
  });

  it('returns 204 and calls removeUserById for a valid different user', async () => {
    const app = buildApp({ userId: ADMIN_USER_ID });
    removeUserById.mockResolvedValue(undefined);

    const res = await request(app).delete(`/api/admin/users/${ANOTHER_VALID_ID}`);

    expect(res.status).toBe(204);
    expect(removeUserById).toHaveBeenCalledWith(ANOTHER_VALID_ID, 'test-token');
  });

  it('propagates upstream error status', async () => {
    const app = buildApp({ userId: ADMIN_USER_ID });
    const err = Object.assign(new Error('not found'), { status: 404, response: { status: 404 } });
    removeUserById.mockRejectedValue(err);

    const res = await request(app).delete(`/api/admin/users/${ANOTHER_VALID_ID}`);

    expect(res.status).toBe(404);
  });
});
