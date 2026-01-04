/**
 * Dapr Secret Management Service
 * Provides secret management using Dapr's secret store building block.
 */

import { DaprClient } from '@dapr/dapr';
import logger from './logger.js';

class DaprSecretManager {
  constructor() {
    this.daprHost = process.env.DAPR_HOST || '127.0.0.1';
    this.daprPort = process.env.DAPR_HTTP_PORT || '3503';
    this.secretStoreName = 'secret-store';

    this.client = new DaprClient({
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      daprEnabled: true,
      secretStore: this.secretStoreName,
    });
  }

  /**
   * Get a secret value from Dapr secret store
   * @param {string} secretName - Name of the secret to retrieve
   * @returns {Promise<string>} Secret value
   */
  async getSecret(secretName) {
    try {
      const response = await this.client.secret.get(this.secretStoreName, secretName);

      if (response && secretName in response) {
        logger.debug('Retrieved secret from Dapr', {
          event: 'secret_retrieved',
          secretName,
          source: 'dapr',
          store: this.secretStoreName,
        });
        return String(response[secretName]);
      }

      throw new Error(`Secret '${secretName}' not found in Dapr store`);
    } catch (error) {
      logger.error(`Failed to get secret from Dapr: ${error.message}`, {
        event: 'secret_retrieval_error',
        secretName,
        error: error.message,
        store: this.secretStoreName,
      });
      throw error;
    }
  }

  /**
   * Get JWT configuration from Dapr secrets
   * @returns {Promise<Object>} JWT configuration parameters
   */
  async getJwtConfig() {
    const secret = await this.getSecret('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET not found in Dapr secret store');
    }

    return {
      secret,
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
      issuer: process.env.JWT_ISSUER || 'auth-service',
      audience: process.env.JWT_AUDIENCE || 'xshopai-platform',
    };
  }
}

// Global instance
export const secretManager = new DaprSecretManager();

// Helper functions for easy access
export const getJwtConfig = () => secretManager.getJwtConfig();
