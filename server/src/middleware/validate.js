import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/enums.js';

/**
 * validate({ body, params, query }) — pass Zod schemas for whichever parts
 * of the request need checking. Parsed (and coerced/defaulted) values are
 * written back onto req, so controllers can trust req.body etc. afterwards.
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return next(AppError.badRequest('Validation failed', ERROR_CODES.VALIDATION_ERROR, details));
    }
    next(err);
  }
};
