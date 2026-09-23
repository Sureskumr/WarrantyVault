import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as verificationService from '../services/verificationService.js';

export const verifyByToken = catchAsync(async (req, res) => {
  const result = await verificationService.verifyByToken(req.params.token);
  return sendSuccess(res, { message: 'Invoice Verified', data: result });
});

export const lookup = catchAsync(async (req, res) => {
  const result = await verificationService.lookup(req.body);
  return sendSuccess(res, { message: 'Match found', data: result });
});

export const sendOtp = catchAsync(async (req, res) => {
  const result = await verificationService.sendVerificationOtp(req.body);
  return sendSuccess(res, { message: 'OTP sent to the phone number on file', data: result });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const result = await verificationService.verifyWithOtp(req.body);
  return sendSuccess(res, { message: 'Warranty verified', data: result });
});
