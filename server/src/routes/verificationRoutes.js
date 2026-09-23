import { Router } from 'express';
import * as verificationController from '../controllers/verificationController.js';
import { validate } from '../middleware/validate.js';
import { otpLimiter } from '../middleware/rateLimiters.js';
import { lookupSchema, sendOtpSchema, verifyOtpSchema, tokenParamSchema } from '../validators/verificationValidators.js';

const router = Router();

// Public — no requireAuth. These endpoints are the whole point of the QR
// on a physical/digital invoice: anyone with the link/QR can check status.
router.get('/invoice/:token', validate({ params: tokenParamSchema }), verificationController.verifyByToken);
router.post('/lookup', otpLimiter, validate({ body: lookupSchema }), verificationController.lookup);
router.post('/send-otp', otpLimiter, validate({ body: sendOtpSchema }), verificationController.sendOtp);
router.post('/verify-otp', otpLimiter, validate({ body: verifyOtpSchema }), verificationController.verifyOtp);

export default router;
