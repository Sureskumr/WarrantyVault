import { Store } from '../models/Store.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS } from '../constants/enums.js';

export async function getStoreById(storeId) {
  const store = await Store.findById(storeId);
  if (!store) throw AppError.notFound('Store not found');
  return store;
}

export async function updateStore({ actingUser, updates, req }) {
  const store = await Store.findById(actingUser.storeId);
  if (!store) throw AppError.notFound('Store not found');

  const oldValue = store.toObject();
  Object.assign(store, updates);
  await store.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: store._id,
    action: AUDIT_ACTIONS.STORE_UPDATED,
    entityType: 'Store',
    entityId: store._id,
    oldValue,
    newValue: store.toObject(),
    req,
  });

  return store;
}
