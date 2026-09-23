import { logger } from '../config/logger.js';
import { sendError } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/enums.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: ERROR_CODES.NOT_FOUND,
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Known/operational errors (AppError) pass through as-is.
  if (err.isOperational) {
    if (err.statusCode >= 500) logger.error(err.message, { stack: err.stack });
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      details,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ');
    return sendError(res, {
      statusCode: 409,
      message: `Duplicate value for field(s): ${field}`,
      errorCode: ERROR_CODES.DUPLICATE,
    });
  }

  // Mongoose bad ObjectId cast
  if (err.name === 'CastError') {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid identifier: ${err.value}`,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, {
      statusCode: 401,
      message: 'Invalid or expired authentication token',
      errorCode: ERROR_CODES.UNAUTHORIZED,
    });
  }

  // Unknown/unexpected error — never leak internals in production.
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return sendError(res, {
    statusCode: 500,
    message: isProd ? 'Internal server error' : err.message,
    errorCode: ERROR_CODES.SERVER_ERROR,
    details: isProd ? undefined : err.stack,
  });
}
