import { mockProvider } from './mockProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// Twilio/MSG91 providers would be added here behind the same `send()` interface.
// Falling back to mock (with a warning) keeps local/dev environments functional
// even if a provider is selected but not yet implemented.
const providers = {
  mock: mockProvider,
};

export function getSmsProvider() {
  const provider = providers[env.SMS_PROVIDER];
  if (!provider) {
    logger.warn(`SMS provider "${env.SMS_PROVIDER}" not implemented, falling back to mock`);
    return mockProvider;
  }
  return provider;
}
