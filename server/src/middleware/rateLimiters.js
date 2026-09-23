import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ERROR_CODES } from '../constants/enums.js';

const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later',
    errorCode: ERROR_CODES.RATE_LIMITED,
  });
};

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Tighter limits for auth (brute-force protection) and OTP (SMS-cost/abuse protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
