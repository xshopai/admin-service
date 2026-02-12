import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cookieParser from 'cookie-parser';

import validateConfig from './validators/config.validator.js';
import config from './core/config.js';
import logger from './core/logger.js';
import adminRoutes from './routes/admin.routes.js';
import homeRoutes from './routes/home.routes.js';
import operationalRoutes from './routes/operational.routes.js';
import traceContextMiddleware from './middlewares/traceContext.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

// Validate configuration before starting
validateConfig();
const app = express();

// Trust proxy for accurate IP address extraction
app.set('trust proxy', true);

app.use(traceContextMiddleware);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', homeRoutes);
app.use('/', operationalRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use(errorHandler);

const PORT = config.server.port;
const HOST = config.server.host;
const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;

app.listen(PORT, HOST, () => {
  logger.info(`Admin service running on ${displayHost}:${PORT} in ${config.env} mode`, {
    service: 'admin-service',
    version: '1.0.0',
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
