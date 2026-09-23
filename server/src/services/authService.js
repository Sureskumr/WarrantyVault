import crypto from "crypto";
import { User } from "../models/User.js";
import { Store } from "../models/Store.js";
import { Customer } from "../models/Customer.js";
import { AppError } from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { ROLES } from "../constants/enums.js";
import { recordAudit } from "./auditService.js";
import { AUDIT_ACTIONS } from "../constants/enums.js";

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Public self-registration always creates a brand-new Store with the
 * registrant as its OWNER. Any other role (MANAGER/CASHIER/TECHNICIAN/
 * CUSTOMER) is created by an authenticated OWNER/MANAGER via the users
 * service instead — never through this endpoint. That's what keeps a
 * stranger from POSTing role: "OWNER" onto someone else's store.
 */
export async function registerOwnerWithStore({
  name,
  email,
  phone,
  password,
  storeName,
}) {
  const existing = await User.findOne({ email });
  if (existing)
    throw AppError.conflict("An account with this email already exists");

  let createdUser = null;
  let createdStore = null;

  try {
    const passwordHash = await User.hashPassword(password);
    createdUser = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: ROLES.OWNER,
      storeId: null,
    });

    createdStore = await Store.create({
      storeName: storeName || `${name}'s Store`,
      ownerId: createdUser._id,
      phone,
      email,
    });

    createdUser.storeId = createdStore._id;
    await createdUser.save();
    return createdUser;
  } catch (error) {
    if (createdUser?._id) {
      await User.findByIdAndDelete(createdUser._id).catch(() => {});
    }
    if (createdStore?._id) {
      await Store.findByIdAndDelete(createdStore._id).catch(() => {});
    }
    throw error;
  }
}

export async function registerCustomer({ name, email, phone, password }) {
  const existing = await User.findOne({ email });
  if (existing)
    throw AppError.conflict("An account with this email already exists");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: ROLES.CUSTOMER,
    storeId: null,
  });

  // Link any existing Customer records (created by stores at billing time)
  // that share this phone number, so purchase history from before the
  // portal account existed shows up immediately.
  await Customer.updateMany({ phone, userId: null }, { userId: user._id });

  return user;
}
export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.isActive)
    throw AppError.unauthorized("Invalid email or password");

  const valid = await user.comparePassword(password);
  if (!valid) throw AppError.unauthorized("Invalid email or password");

  const tokens = await issueTokens(user);
  user.lastLoginAt = new Date();
  await user.save();

  return { user, ...tokens };
}

export async function issueTokens(user) {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    storeId: user.storeId,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw AppError.unauthorized("Refresh token missing");

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(payload.userId).select("+refreshTokenHash");
  if (!user || !user.isActive || !user.refreshTokenHash) {
    throw AppError.unauthorized("Session no longer valid");
  }
  if (hashToken(refreshToken) !== user.refreshTokenHash) {
    // Token reuse / mismatch — invalidate the session defensively.
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });
    throw AppError.unauthorized("Session invalidated, please log in again");
  }

  return issueTokens(user);
}

export async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  // Always behave the same whether or not the account exists, to avoid
  // leaking which emails are registered.
  if (!user) return { rawToken: null };

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save({ validateBeforeSave: false });

  return { rawToken, user };
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) throw AppError.badRequest("Reset token is invalid or has expired");

  user.passwordHash = await User.hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.refreshTokenHash = null; // force re-login everywhere
  await user.save();

  return user;
}

export async function changeUserRole({
  actingUser,
  targetUserId,
  newRole,
  reason,
  req,
}) {
  const target = await User.findOne({
    _id: targetUserId,
    storeId: actingUser.storeId,
  });
  if (!target) throw AppError.notFound("User not found in this store");

  const oldRole = target.role;
  target.role = newRole;
  await target.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
    entityType: "User",
    entityId: target._id,
    oldValue: { role: oldRole },
    newValue: { role: newRole },
    reason,
    req,
  });

  return target;
}
