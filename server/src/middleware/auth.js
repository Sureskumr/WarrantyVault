import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { User } from '../models/User.js';

/**
 * Populates req.user from a verified access token.
 *
 * SECURITY: req.user.storeId / req.user.role come from the freshly-loaded
 * User document, NOT from the JWT payload or any client-supplied field.
 * A JWT can go stale (e.g. role changed, user deactivated after issue) —
 * re-reading the user on every request keeps authorization decisions correct.
 */
export const requireAuth = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

  if (!token) throw AppError.unauthorized('Authentication token missing');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Account not found or deactivated');
  }

  req.user = {
    id: user._id.toString(),
    storeId: user.storeId ? user.storeId.toString() : null,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  next();
});

/**
 * RBAC gate. Usage: requireRole('OWNER', 'MANAGER')
 */
export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) {
    return next(AppError.forbidden(`This action requires one of: ${allowedRoles.join(', ')}`));
  }
  next();
};

/**
 * Tenant isolation gate. Ensures a staff user's own storeId matches the
 * :storeId route param (when present) or is attached for downstream
 * controllers to scope every query with. Staff users without a storeId
 * (shouldn't happen, but defensively) are rejected.
 */
export const requireStoreContext = (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!req.user.storeId) {
    return next(AppError.forbidden('User is not associated with a store'));
  }
  const routeStoreId = req.params.storeId;
  if (routeStoreId && routeStoreId !== req.user.storeId) {
    // Store A must never touch Store B's data, even with a valid token.
    return next(AppError.forbidden('Cross-store access is not permitted'));
  }
  next();
};
