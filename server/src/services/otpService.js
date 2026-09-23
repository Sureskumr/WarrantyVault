import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OtpVerification } from '../models/OtpVerification.js';
import { getSmsProvider } from './otp/providerRegistry.js';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../constants/enums.js';

function generateSixDigitOtp() {
  // Cryptographically random 6-digit code, zero-padded.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function sendOtp({ phone, email, purpose, referenceId = null, storeId = null }) {
  if (!phone && !email) throw AppError.badRequest('Phone or email is required to send an OTP');

  const code = generateSixDigitOtp();
  const hashedOtp = await bcrypt.hash(code, 10);

  await OtpVerification.create({
    phone,
    email,
    hashedOtp,
    purpose,
    referenceId,
    storeId,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5-minute expiry per spec §10
  });

  const provider = getSmsProvider();
  if (phone) {
    await provider.send({ to: phone, message: `Your DigiWarranty verification code is ${code}. It expires in 5 minutes.` });
  }

  // Never return the raw code to the caller in a real deployment. Only surface it
  // when using the mock provider, so local/dev flows stay testable end-to-end.
  return { sent: true, devOtp: provider.name === 'mock' ? code : undefined };
}

export async function verifyOtp({ phone, email, purpose, code, referenceId = null }) {
  const filter = { purpose, verified: false, expiresAt: { $gt: new Date() } };
  if (phone) filter.phone = phone;
  if (email) filter.email = email;
  if (referenceId) filter.referenceId = referenceId;

  const record = await OtpVerification.findOne(filter).sort({ createdAt: -1 });
  if (!record) throw new AppError('OTP expired or not found, please request a new one', 400, ERROR_CODES.OTP_EXPIRED);

  if (record.attempts >= record.maxAttempts) {
    throw new AppError('Too many incorrect attempts, please request a new OTP', 429, ERROR_CODES.OTP_INVALID);
  }

  const valid = await bcrypt.compare(code, record.hashedOtp);
  if (!valid) {
    record.attempts += 1;
    await record.save();
    throw new AppError('Incorrect OTP', 400, ERROR_CODES.OTP_INVALID);
  }

  record.verified = true;
  await record.save();
  return true;
}
