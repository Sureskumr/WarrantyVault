import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Access token payload intentionally carries ONLY userId, storeId, role —
 * per spec section 3. Never trust anything else from the client as authority.
 */
export function signAccessToken({ userId, storeId, role }) {
  return jwt.sign({ userId, storeId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken({ userId }) {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
