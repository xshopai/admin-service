import adminValidator from '../../src/validators/admin.validator.js';

describe('adminValidator', () => {
  describe('isValidObjectId', () => {
    it('should return true for valid ObjectId', () => {
      expect(adminValidator.isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });
    it('should return false for invalid ObjectId', () => {
      expect(adminValidator.isValidObjectId('notanid')).toBe(false);
    });
  });

  describe('isValidRoles', () => {
    it('should return true for valid roles', () => {
      expect(adminValidator.isValidRoles(['user', 'admin'])).toBe(true);
    });
    it('should return false for invalid roles', () => {
      expect(adminValidator.isValidRoles(['user', 'superadmin'])).toBe(false);
      expect(adminValidator.isValidRoles('user')).toBe(false);
    });
  });

  describe('isValidIsActive', () => {
    it('should return true for boolean', () => {
      expect(adminValidator.isValidIsActive(true)).toBe(true);
      expect(adminValidator.isValidIsActive(false)).toBe(true);
    });
    it('should return false for non-boolean', () => {
      expect(adminValidator.isValidIsActive('true')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(adminValidator.isValidEmail('test@example.com')).toBe(true);
    });
    it('should return false for invalid email', () => {
      expect(adminValidator.isValidEmail('notanemail')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid password', () => {
      expect(adminValidator.isValidPassword('Password1')).toBe(true);
    });
    it('should return false for invalid password', () => {
      expect(adminValidator.isValidPassword('short')).toBe(false);
      expect(adminValidator.isValidPassword('allletters')).toBe(false);
      expect(adminValidator.isValidPassword('12345678')).toBe(false);
    });
  });

  describe('isValidUpdatePayload', () => {
    it('should return true for allowed fields', () => {
      expect(adminValidator.isValidUpdatePayload({ name: 'Test', email: 'a@b.com' })).toBe(true);
    });
    it('should return false for disallowed fields', () => {
      expect(adminValidator.isValidUpdatePayload({ foo: 'bar' })).toBe(false);
    });
  });
});
