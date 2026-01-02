export function info(req, res) {
  res.json({
    message: 'Welcome to the Admin Service',
    service: 'admin-service',
    description: 'Administrative management service for xShop.ai platform',
    environment: process.env.NODE_ENV || 'development',
  });
}

export function version(req, res) {
  res.json({
    version: process.env.API_VERSION || '1.0.0',
  });
}
