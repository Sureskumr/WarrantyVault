import { logger } from '../../config/logger.js';

/**
 * Development provider: never actually sends anything, just logs.
 * Swap for a real provider (Twilio/MSG91/etc.) by implementing the same
 * `send({ to, message })` interface and switching SMS_PROVIDER in .env.
 */
export const mockProvider = {
  name: 'mock',
  async send({ to, message }) {
    logger.info(`[MOCK SMS/WHATSAPP] -> ${to}: ${message}`);
    return { success: true, providerMessageId: `mock_${Date.now()}` };
  },
};
