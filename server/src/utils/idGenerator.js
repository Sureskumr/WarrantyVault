import { customAlphabet } from 'nanoid';

// Unambiguous alphabet (no 0/O/1/I) for human-typed verification codes.
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const shortId = customAlphabet(alphabet, 6);
const tokenId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

/**
 * Invoice numbers must not be sequential/guessable (spec §7): "INV-2026-09-8F29A7".
 */
export function generateInvoiceNumber(prefix = 'INV') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}-${month}-${shortId()}`;
}

/**
 * Opaque, unguessable token used in public verification URLs
 * (/verify/invoice/<token>) so we never expose a Mongo ObjectId publicly.
 */
export function generateVerificationToken() {
  return tokenId();
}

export function generateClaimId() {
  return `CLM-${shortId()}${shortId()}`;
}
