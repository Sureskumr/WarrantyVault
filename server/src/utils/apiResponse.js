// Every endpoint in the platform responds with the same envelope shape,
// per the spec's { success, message, data } / { success, message, errorCode } contract.

export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendError(res, { statusCode = 500, message = 'Something went wrong', errorCode = 'SERVER_ERROR', details } = {}) {
  const body = { success: false, message, errorCode };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}
