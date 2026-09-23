import { ServiceRequest } from '../models/ServiceRequest.js';
import { ServiceHistory } from '../models/ServiceHistory.js';
import { WarrantyClaim } from '../models/WarrantyClaim.js';
import { Warranty } from '../models/Warranty.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateClaimId } from '../utils/idGenerator.js';
import { recordAudit } from './auditService.js';
import { notifyCustomer, notifyStaff } from './notificationService.js';
import { SERVICE_STATUSES, CLAIM_STATUSES, AUDIT_ACTIONS, ROLES } from '../constants/enums.js';

async function logHistory({ storeId, serviceRequestId, productId, customerId, technicianId, status, note, performedBy }) {
  await ServiceHistory.create({ storeId, serviceRequestId, productId, customerId, technicianId, status, note, performedBy });
}

/**
 * A customer (or a cashier on their behalf) raises a request. If an active
 * warranty exists for this product+customer it's linked immediately and the
 * request moves straight to VERIFICATION_PENDING; otherwise it stays CREATED
 * for staff to look into manually — service eligibility is checked against
 * warranty status but never treated as a guarantee (rule #9).
 */
export async function createServiceRequest({ storeId, customerId, productId, problemDescription, photos, video, preferredDate, preferredTime, contactPhone, performedBy }) {
  const warranty = await Warranty.findOne({ storeId, customerId, productId }).sort({ createdAt: -1 });

  const request = await ServiceRequest.create({
    storeId,
    customerId,
    productId,
    warrantyId: warranty?._id || null,
    problemDescription,
    photos: photos || [],
    video: video || '',
    preferredDate,
    preferredTime,
    contactPhone,
    status: warranty ? SERVICE_STATUSES.VERIFICATION_PENDING : SERVICE_STATUSES.CREATED,
    createdBy: performedBy || null,
  });

  await logHistory({
    storeId,
    serviceRequestId: request._id,
    productId,
    customerId,
    status: request.status,
    note: 'Service request created',
    performedBy: performedBy || customerId,
  });

  await notifyStaff({
    storeId,
    userId: null,
    event: 'SERVICE_REQUEST_CREATED',
    title: 'New service request',
    message: `A new service request was raised for a product under warranty ${warranty ? '' : '(unverified) '}.`,
    relatedEntityType: 'ServiceRequest',
    relatedEntityId: request._id,
  });

  return request;
}

async function assertStoreScoped({ storeId, requestId }) {
  const request = await ServiceRequest.findOne({ _id: requestId, storeId });
  if (!request) throw AppError.notFound('Service request not found');
  return request;
}

/**
 * Staff confirms the linked warranty actually covers this request. Creates
 * the WarrantyClaim record that tracks approval/repair/resolution from here on.
 */
export async function verifyServiceRequest({ storeId, requestId, actingUser, approve, rejectionReason }) {
  const request = await assertStoreScoped({ storeId, requestId });

  if (!approve) {
    request.status = SERVICE_STATUSES.REJECTED;
    request.rejectionReason = rejectionReason || 'Not covered by warranty';
    await request.save();
    await logHistory({ storeId, serviceRequestId: request._id, productId: request.productId, customerId: request.customerId, status: request.status, note: request.rejectionReason, performedBy: actingUser.id });
    return request;
  }

  if (!request.warrantyId) throw AppError.badRequest('No warranty linked to this request — cannot verify');
  const warranty = await Warranty.findById(request.warrantyId);
  const status = warranty?.computeStatus();
  if (!warranty || (status !== 'ACTIVE' && status !== 'EXPIRING_SOON')) {
    throw AppError.badRequest(`Linked warranty is ${status || 'missing'}, cannot verify this request`);
  }

  const existingOpenClaim = await WarrantyClaim.findOne({
    warrantyId: warranty._id,
    status: { $in: [CLAIM_STATUSES.PENDING, CLAIM_STATUSES.APPROVED, CLAIM_STATUSES.IN_REPAIR] },
  });
  if (existingOpenClaim) throw AppError.conflict('An open claim already exists for this warranty');

  request.status = SERVICE_STATUSES.VERIFIED;
  await request.save();

  const claim = await WarrantyClaim.create({
    storeId,
    claimId: generateClaimId(),
    warrantyId: warranty._id,
    customerId: request.customerId,
    productId: request.productId,
    serviceRequestId: request._id,
    issue: request.problemDescription,
    status: CLAIM_STATUSES.APPROVED,
  });

  await recordAudit({
    userId: actingUser.id,
    storeId,
    action: AUDIT_ACTIONS.WARRANTY_CLAIM_CREATED,
    entityType: 'WarrantyClaim',
    entityId: claim._id,
    newValue: { claimId: claim.claimId, serviceRequestId: request._id },
  });

  await logHistory({ storeId, serviceRequestId: request._id, productId: request.productId, customerId: request.customerId, status: request.status, note: `Warranty verified, claim ${claim.claimId} opened`, performedBy: actingUser.id });

  return request;
}

export async function assignTechnician({ storeId, requestId, technicianId, actingUser }) {
  const request = await assertStoreScoped({ storeId, requestId });
  const technician = await User.findOne({ _id: technicianId, storeId, role: ROLES.TECHNICIAN, isActive: true });
  if (!technician) throw AppError.badRequest('Technician not found in this store');

  request.technicianId = technicianId;
  request.status = SERVICE_STATUSES.ASSIGNED;
  await request.save();

  await logHistory({ storeId, serviceRequestId: request._id, productId: request.productId, customerId: request.customerId, technicianId, status: request.status, note: `Assigned to ${technician.name}`, performedBy: actingUser.id });

  await notifyStaff({ storeId, userId: technicianId, event: 'TECHNICIAN_ASSIGNED', title: 'New assignment', message: 'You have been assigned a new service request.', relatedEntityType: 'ServiceRequest', relatedEntityId: request._id });
  await notifyCustomer({ storeId, customerId: request.customerId, event: 'TECHNICIAN_ASSIGNED', title: 'Technician assigned', message: `${technician.name} has been assigned to your service request.`, relatedEntityType: 'ServiceRequest', relatedEntityId: request._id });

  return request;
}

const ALLOWED_TECH_TRANSITIONS = {
  ASSIGNED: [SERVICE_STATUSES.TECHNICIAN_VISIT],
  TECHNICIAN_VISIT: [SERVICE_STATUSES.DIAGNOSIS],
  DIAGNOSIS: [SERVICE_STATUSES.REPAIR_IN_PROGRESS, SERVICE_STATUSES.WAITING_FOR_PART],
  REPAIR_IN_PROGRESS: [SERVICE_STATUSES.WAITING_FOR_PART, SERVICE_STATUSES.COMPLETED],
  WAITING_FOR_PART: [SERVICE_STATUSES.REPAIR_IN_PROGRESS, SERVICE_STATUSES.COMPLETED],
};

/**
 * Single entry point for every technician action (accept/start visit,
 * diagnosis, repair notes, parts, completion). `updates` may carry
 * diagnosis / repairNotes / partsUsed / photos alongside the status move.
 */
export async function updateServiceStatus({ storeId, requestId, technicianId, nextStatus, updates = {} }) {
  const request = await ServiceRequest.findOne({ _id: requestId, storeId, technicianId });
  if (!request) throw AppError.notFound('Service request not found or not assigned to you');

  const allowed = ALLOWED_TECH_TRANSITIONS[request.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw AppError.badRequest(`Cannot move from ${request.status} to ${nextStatus}`);
  }

  request.status = nextStatus;
  if (updates.diagnosis) request.diagnosis = updates.diagnosis;
  if (updates.repairNotes) request.repairNotes = updates.repairNotes;
  if (updates.partsUsed) request.partsUsed = updates.partsUsed;
  if (updates.photos?.length) request.photos.push(...updates.photos);
  await request.save();

  await logHistory({
    storeId,
    serviceRequestId: request._id,
    productId: request.productId,
    customerId: request.customerId,
    technicianId,
    status: nextStatus,
    note: updates.note || updates.diagnosis || updates.repairNotes || '',
    performedBy: technicianId,
  });

  if (nextStatus === SERVICE_STATUSES.COMPLETED) {
    await WarrantyClaim.findOneAndUpdate(
      { serviceRequestId: request._id },
      { status: CLAIM_STATUSES.RESOLVED, resolution: updates.repairNotes || 'Repair completed' }
    );
    if (request.warrantyId) {
      await Warranty.findByIdAndUpdate(request.warrantyId, { $inc: { claimCount: 1 } });
    }
    await notifyCustomer({
      storeId,
      customerId: request.customerId,
      event: 'SERVICE_COMPLETED',
      title: 'Service completed',
      message: 'Your service request has been completed. View the service history for details.',
      relatedEntityType: 'ServiceRequest',
      relatedEntityId: request._id,
    });
  } else {
    await notifyCustomer({
      storeId,
      customerId: request.customerId,
      event: 'SERVICE_STATUS_CHANGED',
      title: 'Service update',
      message: `Your service request status changed to ${nextStatus.replace(/_/g, ' ').toLowerCase()}.`,
      relatedEntityType: 'ServiceRequest',
      relatedEntityId: request._id,
    });
  }

  await recordAudit({
    userId: technicianId,
    storeId,
    action: AUDIT_ACTIONS.SERVICE_STATUS_CHANGED,
    entityType: 'ServiceRequest',
    entityId: request._id,
    newValue: { status: nextStatus },
  });

  return request;
}

export async function listServiceRequests({ storeId, role, userId, customerId, page = 1, limit = 20, status }) {
  const filter = { storeId };
  if (role === ROLES.TECHNICIAN) filter.technicianId = userId;
  if (role === ROLES.CUSTOMER) filter.customerId = customerId;
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    ServiceRequest.find(filter)
      .populate('productId', 'name brand')
      .populate('customerId', 'name phone')
      .populate('technicianId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ServiceRequest.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getServiceRequestById({ storeId, requestId }) {
  const request = await ServiceRequest.findOne({ _id: requestId, storeId })
    .populate('productId', 'name brand modelNumber')
    .populate('customerId', 'name phone email')
    .populate('technicianId', 'name phone');
  if (!request) throw AppError.notFound('Service request not found');

  const history = await ServiceHistory.find({ serviceRequestId: request._id }).sort({ timestamp: 1 }).populate('performedBy', 'name role');
  return { request, history };
}

export async function getProductServiceHistory({ storeId, productId }) {
  return ServiceHistory.find({ storeId, productId })
    .sort({ timestamp: -1 })
    .populate('technicianId', 'name')
    .populate('performedBy', 'name role');
}
