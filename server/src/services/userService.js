import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS, ROLES } from '../constants/enums.js';

export async function createStaffUser({ actingUser, name, email, phone, password, role, req }) {
  // Only OWNER may create another MANAGER; MANAGER can create CASHIER/TECHNICIAN.
  if (role === ROLES.MANAGER && actingUser.role !== ROLES.OWNER) {
    throw AppError.forbidden('Only an OWNER can create MANAGER accounts');
  }

  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    storeId: actingUser.storeId,
  });

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.USER_CREATED,
    entityType: 'User',
    entityId: user._id,
    newValue: { name, email, role },
    req,
  });

  return user;
}

export async function listStoreUsers({ storeId, page, limit, role, search }) {
  const filter = { storeId };
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items: items.map((u) => u.toSafeJSON()), total, page, limit, pages: Math.ceil(total / limit) };
}

export async function deactivateStaffUser({ actingUser, targetUserId, req }) {
  const target = await User.findOne({ _id: targetUserId, storeId: actingUser.storeId });
  if (!target) throw AppError.notFound('User not found in this store');
  if (target.role === ROLES.OWNER) throw AppError.forbidden('Cannot deactivate the store owner');

  target.isActive = false;
  target.refreshTokenHash = null;
  await target.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.USER_DEACTIVATED,
    entityType: 'User',
    entityId: target._id,
    req,
  });

  return target;
}
