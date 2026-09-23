import { Warranty } from '../models/Warranty.js';
import { DURATION_UNITS } from '../constants/enums.js';
import { AppError } from '../utils/AppError.js';

function addDuration(date, duration, unit) {
  const d = new Date(date);
  if (unit === DURATION_UNITS.DAYS) d.setDate(d.getDate() + duration);
  else if (unit === DURATION_UNITS.MONTHS) d.setMonth(d.getMonth() + duration);
  else if (unit === DURATION_UNITS.YEARS) d.setFullYear(d.getFullYear() + duration);
  return d;
}

/**
 * Builds a Warranty document (not yet saved) from a product's warranty
 * template at the moment of sale. Called inside invoiceService's transaction
 * so a failed invoice never leaves an orphaned warranty (rule: transactional
 * invoice+warranty creation).
 *
 * `referenceDate` is resolved per startType — PURCHASE_DATE uses the invoice's
 * purchase date; DELIVERY/INSTALLATION/ACTIVATION default to purchase date for
 * now and are meant to be updated later via a dedicated activation endpoint
 * once delivery/installation is confirmed (Phase 6 extension point).
 */
export function buildWarrantyFromTemplate({ product, storeId, invoiceId, customerId, serialNumber, purchaseDate, session }) {
  const template = product.warrantyTemplate || {};
  const duration = template.duration ?? 12;
  const durationUnit = template.durationUnit ?? DURATION_UNITS.MONTHS;
  const startDate = purchaseDate; // see docstring re: other start types
  const endDate = addDuration(startDate, duration, durationUnit);

  return new Warranty({
    storeId,
    invoiceId,
    customerId,
    productId: product._id,
    serialNumber: serialNumber || '',
    provider: template.provider || '',
    startType: template.startType || 'PURCHASE_DATE',
    startDate,
    duration,
    durationUnit,
    endDate,
    terms: template.terms || '',
    coveredComponents: template.coveredComponents || [],
    excludedConditions: template.excludedConditions || [],
  });
}

export async function listWarranties({ storeId, customerId, page = 1, limit = 20, status }) {
  const filter = { storeId };
  if (customerId) filter.customerId = customerId;

  const [docs, total] = await Promise.all([
    Warranty.find(filter)
      .populate('productId', 'name brand images')
      .populate('customerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Warranty.countDocuments(filter),
  ]);

  let items = docs.map((w) => ({ ...w.toObject(), status: w.computeStatus(), daysRemaining: w.daysRemaining() }));
  if (status) items = items.filter((w) => w.status === status);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getWarrantyById({ storeId, warrantyId }) {
  const warranty = await Warranty.findOne({ _id: warrantyId, storeId })
    .populate('productId', 'name brand images')
    .populate('customerId', 'name phone email')
    .populate('invoiceId', 'invoiceNumber purchaseDate');
  if (!warranty) throw AppError.notFound('Warranty not found', 'WARRANTY_NOT_FOUND');
  return warranty;
}

/**
 * OWNER-only manual override (rule #4: a cashier can never do this).
 * Always writes an AuditLog entry (rule #5) — enforced by the caller.
 */
export async function setManualStatus({ storeId, warrantyId, manualStatus }) {
  const warranty = await Warranty.findOne({ _id: warrantyId, storeId });
  if (!warranty) throw AppError.notFound('Warranty not found', 'WARRANTY_NOT_FOUND');
  warranty.manualStatus = manualStatus;
  await warranty.save();
  return warranty;
}
