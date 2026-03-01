/**
 * Admin Service Configuration
 */

/**
 * Configuration object
 */
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  server: {
    port: parseInt(process.env.PORT, 10) || 3008,
    host: process.env.HOST || '0.0.0.0',
  },

  // Platform Mode
  platformMode: process.env.PLATFORM_MODE || 'direct',

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS === 'true',
  },

  // Admin specific settings
  admin: {
    sessionTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT, 10) || 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS, 10) || 5,
    lockoutDuration: parseInt(process.env.ADMIN_LOCKOUT_DURATION, 10) || 15 * 60 * 1000, // 15 minutes
  },
};

export default config;
