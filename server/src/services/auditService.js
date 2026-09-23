import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../config/logger.js';

/**
 * Records an audit trail entry. Failures here are logged but never thrown —
 * an audit-logging bug must not block the business operation it's recording.
 */
export async function recordAudit({
  userId,
  storeId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  reason = '',
  req = null,
}) {
  try {
    await AuditLog.create({
      userId,
      storeId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      reason,
      ipAddress: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (err) {
    logger.error('Failed to write audit log', { action, entityType, entityId, error: err.message });
  }
}
