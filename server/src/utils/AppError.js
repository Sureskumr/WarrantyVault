import { ERROR_CODES } from '../constants/enums.js';

/**
 * Operational error thrown deliberately by app code (as opposed to a bug).
 * The centralized error middleware knows how to serialize these consistently.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = ERROR_CODES.SERVER_ERROR, details) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = ERROR_CODES.VALIDATION_ERROR, details) {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(message = 'Not authenticated') {
    return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Not authorized to perform this action') {
    return new AppError(message, 403, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found', errorCode = ERROR_CODES.NOT_FOUND) {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message = 'Resource already exists', errorCode = ERROR_CODES.DUPLICATE) {
    return new AppError(message, 409, errorCode);
  }
}
