/**
 * Dapr Provider Implementation
 * Architecture spec section 5.5.2
 *
 * For deployment to:
 * - Azure Container Apps (built-in Dapr)
 * - Azure Kubernetes Service (Dapr via Helm)
 * - Local development (Docker Compose with Dapr sidecar)
 */

import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import MessagingProvider from './provider.js';
import logger from '../core/logger.js';

const DAPR_HOST = process.env.DAPR_HOST || 'localhost';
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || '3500';
const DAPR_PUBSUB_NAME = 'pubsub';

/**
 * Dapr-based messaging provider.
 * Uses Dapr sidecar for pub/sub messaging.
 */
class DaprProvider extends MessagingProvider {
  /**
   * Initialize Dapr provider.
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.pubsubName='pubsub'] - Name of Dapr pub/sub component
   * @param {string} [options.daprHost] - Dapr sidecar host
   * @param {number} [options.daprPort] - Dapr sidecar HTTP port
   */
  constructor(options = {}) {
    super();
    this.pubsubName = options.pubsubName || DAPR_PUBSUB_NAME;
    this.daprHost = options.daprHost || DAPR_HOST;
    this.daprPort = options.daprPort || DAPR_HTTP_PORT;
    this.client = null;

    logger.info('Initialized DaprProvider', {
      operation: 'messaging_init',
      provider: 'dapr',
      pubsubName: this.pubsubName,
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });
  }

  /**
   * Get or create Dapr client (lazy initialization).
   * @returns {DaprClient} Dapr client instance
   */
  _getClient() {
    if (!this.client) {
      this.client = new DaprClient({
        daprHost: this.daprHost,
        daprPort: String(this.daprPort),
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });
    }
    return this.client;
  }

  /**
   * Publish event via Dapr pub/sub.
   *
   * Uses the Dapr SDK to publish events to the configured pub/sub component.
   * The Dapr sidecar handles routing to the actual message broker (RabbitMQ, etc.)
   *
   * @param {string} topic - Event topic name (e.g., 'admin.user.updated')
   * @param {Object} eventData - CloudEvents-compliant payload
   * @param {string} [correlationId] - Correlation ID for distributed tracing
   * @returns {Promise<boolean>} True if published successfully, false on error
   */
  async publishEvent(topic, eventData, correlationId = null) {
    try {
      const client = this._getClient();

      // Add correlation ID to metadata if provided
      if (correlationId && eventData.metadata) {
        eventData.metadata.correlationId = correlationId;
      } else if (correlationId) {
        eventData.metadata = { ...eventData.metadata, correlationId };
      }

      await client.pubsub.publish(this.pubsubName, topic, eventData);

      logger.info('Published event via Dapr', {
        operation: 'event_publish',
        provider: 'dapr',
        topic,
        correlationId,
      });

      return true;
    } catch (error) {
      // Log error but don't raise - allows service to continue (graceful degradation)
      logger.error('Failed to publish event via Dapr', {
        operation: 'event_publish',
        provider: 'dapr',
        topic,
        correlationId,
        error: error.message,
      });

      return false;
    }
  }

  /**
   * Close Dapr client connection.
   * Dapr client is lightweight; this is mainly for consistency.
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      logger.info('Closing DaprProvider', {
        operation: 'messaging_close',
        provider: 'dapr',
      });
      this.client = null;
    }
  }
}

export default DaprProvider;
