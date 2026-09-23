import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as authService from '../services/authService.js';
import { User } from '../models/User.js';
import { env, isProd } from '../config/env.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = catchAsync(async (req, res) => {
  const user = await authService.registerOwnerWithStore(req.body);
  const { accessToken, refreshToken } = await authService.issueTokens(user);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Store and owner account created',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

export const registerCustomer = catchAsync(async (req, res) => {
  const user = await authService.registerCustomer(req.body);
  const { accessToken, refreshToken } = await authService.issueTokens(user);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Customer account created',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

export const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return sendSuccess(res, {
    message: 'Login successful',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

export const refresh = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return sendSuccess(res, { message: 'Token refreshed', data: { accessToken } });
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  return sendSuccess(res, { message: 'Logged out' });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);
  return sendSuccess(res, { message: 'Current user', data: { user: user.toSafeJSON() } });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { rawToken } = await authService.requestPasswordReset(req.body.email);
  // In production this token is emailed via notificationService, never returned in the API response.
  // It's surfaced here only when SMTP isn't configured, so local/dev flows remain testable end-to-end.
  const devPayload = !env.SMTP_HOST && rawToken ? { devResetToken: rawToken } : undefined;
  return sendSuccess(res, {
    message: 'If that email is registered, a reset link has been sent',
    data: devPayload,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  return sendSuccess(res, { message: 'Password has been reset, please log in again' });
});
