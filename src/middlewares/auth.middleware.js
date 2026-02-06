import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/error.response.js';

// Get JWT config from environment variables (no Dapr dependency)
function getJwtConfigFromEnv() {
  return {
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER || 'xshopai-auth-service',
    audience: process.env.JWT_AUDIENCE || 'xshopai-services',
  };
}

/**
 * Middleware for JWT authentication in the admin service.
 * Verifies the Authorization header, decodes the JWT, and attaches the user payload to req.user.
 * Responds with 401 Unauthorized if the token is missing or invalid.
 */
export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new ErrorResponse('Unauthorized: Missing Authorization header', 401));
  }
  if (!authHeader.startsWith('Bearer ')) {
    return next(new ErrorResponse('Unauthorized: Authorization header must start with Bearer', 401));
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new ErrorResponse('Unauthorized: Missing token', 401));
  }
  try {
    const jwtConfig = getJwtConfigFromEnv();
    const decoded = jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
    };
    next();
  } catch (err) {
    return next(new ErrorResponse('Unauthorized: Invalid or expired token', 401));
  }
};

/**
 * Middleware to require specific roles
 * Usage: requireRoles(['admin', 'manager'])
 */
export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Unauthorized: Authentication required', 401));
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(
        new ErrorResponse(`Forbidden: Required roles: ${roles.join(' or ')}. User has: ${userRoles.join(', ')}`, 403),
      );
    }

    next();
  };
};
