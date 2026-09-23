import { AuditLog } from '../models/AuditLog.js';

export async function listAuditLogs({ storeId, page = 1, limit = 30, action, entityType }) {
  const filter = { storeId };
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
