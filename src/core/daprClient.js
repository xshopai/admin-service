import logger from './logger.js';
import { getMessagingProvider } from '../messaging/index.js';

// Service invocation mode (independent from messaging)
const PLATFORM_MODE = process.env.PLATFORM_MODE || 'direct';
const USE_DAPR = PLATFORM_MODE === 'dapr';

// Dapr sidecar configuration (only used when PLATFORM_MODE=dapr)
const DAPR_HOST = process.env.DAPR_HOST || 'localhost';
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || '3500';

// Service App IDs for Dapr service invocation (used when PLATFORM_MODE=dapr)
const SERVICE_APP_IDS = {
  'user-service': process.env.USER_SERVICE_APP_ID || 'user-service',
  'order-service': process.env.ORDER_SERVICE_APP_ID || 'order-service',
  'product-service': process.env.PRODUCT_SERVICE_APP_ID || 'product-service',
  'payment-service': process.env.PAYMENT_SERVICE_APP_ID || 'payment-service',
  'audit-service': process.env.AUDIT_SERVICE_APP_ID || 'audit-service',
  'notification-service': process.env.NOTIFICATION_SERVICE_APP_ID || 'notification-service',
};

// Direct HTTP URLs for service invocation (used when PLATFORM_MODE=direct)
const SERVICE_URLS = {
  'user-service': process.env.USER_SERVICE_URL || 'http://xshopai-user-service:8002',
  'order-service': process.env.ORDER_SERVICE_URL || 'http://xshopai-order-service:8006',
  'product-service': process.env.PRODUCT_SERVICE_URL || 'http://xshopai-product-service:8001',
  'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://xshopai-payment-service:8009',
  'audit-service': process.env.AUDIT_SERVICE_URL || 'http://xshopai-audit-service:8012',
  'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://xshopai-notification-service:8011',
};

/**
 * Invoke a method on another service
 * - When MESSAGING_PROVIDER=dapr: Uses Dapr service invocation
 * - Otherwise: Uses direct HTTP calls
 *
 * @param {string} serviceName - The logical service name (e.g., 'user-service')
 * @param {string} methodName - The method/endpoint to invoke
 * @param {string} httpMethod - The HTTP method (GET, POST, DELETE, etc.)
 * @param {object} data - The request body (for POST/PUT)
 * @param {object} metadata - Additional metadata (headers, query params)
 * @returns {Promise<object>} - The response from the service
 */
export async function invokeService(serviceName, methodName, httpMethod = 'GET', data = null, metadata = {}) {
  try {
    let url;
    const cleanMethodName = methodName.startsWith('/') ? methodName.slice(1) : methodName;

    if (USE_DAPR) {
      // Dapr service invocation: http://localhost:3500/v1.0/invoke/{appId}/method/{method}
      const appId = SERVICE_APP_IDS[serviceName] || serviceName;
      url = `http://${DAPR_HOST}:${DAPR_HTTP_PORT}/v1.0/invoke/${appId}/method/${cleanMethodName}`;

      logger.debug('Invoking service via Dapr', {
        operation: 'dapr_service_invocation',
        serviceName,
        appId,
        url,
        httpMethod,
      });
    } else {
      // Direct HTTP call
      const baseUrl = SERVICE_URLS[serviceName] || `http://xshopai-${serviceName}:8000`;
      url = `${baseUrl}/${cleanMethodName}`;

      logger.debug('Invoking service via HTTP', {
        operation: 'http_service_invocation',
        serviceName,
        url,
        httpMethod,
      });
    }

    const options = {
      method: httpMethod.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...metadata.headers,
      },
    };

    if (data && httpMethod.toUpperCase() !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return null;
  } catch (error) {
    logger.error('Service invocation failed', {
      operation: USE_DAPR ? 'dapr_service_invocation' : 'http_service_invocation',
      serviceName,
      methodName,
      httpMethod,
      error: error.message,
      errorStack: error.stack,
    });
    throw error;
  }
}

/**
 * Publish an event to a topic via messaging provider
 * Uses the messaging abstraction layer for provider flexibility
 * @param {string} topicName - The topic to publish to
 * @param {object} eventData - The event data to publish
 * @returns {Promise<void>}
 */
export async function publishEvent(topicName, eventData) {
  try {
    const event = {
      eventId: generateEventId(),
      eventType: topicName,
      timestamp: new Date().toISOString(),
      source: 'admin-service',
      data: eventData,
      metadata: {
        traceId: eventData.traceId || 'no-trace',
        spanId: eventData.spanId || 'no-span',
        version: '1.0',
      },
    };

    logger.debug('Publishing event via messaging provider', {
      operation: 'messaging_pubsub',
      topicName,
      eventId: event.eventId,
      traceId: event.metadata.traceId,
      spanId: event.metadata.spanId,
    });

    const provider = getMessagingProvider();
    const success = await provider.publishEvent(topicName, event, event.metadata.traceId);

    if (success) {
      logger.info('Event published successfully', {
        operation: 'messaging_pubsub',
        topicName,
        eventId: event.eventId,
        traceId: event.metadata.traceId,
        spanId: event.metadata.spanId,
      });
    }
  } catch (error) {
    logger.error('Failed to publish event', {
      operation: 'messaging_pubsub',
      topicName,
      error: error.message,
      errorStack: error.stack,
      traceId: eventData?.traceId,
      spanId: eventData?.spanId,
    });
    // Don't throw - graceful degradation (app continues even if event publishing fails)
  }
}

/**
 * Generate a unique event ID
 * @returns {string} - Unique event ID
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  invokeService,
  publishEvent,
};
