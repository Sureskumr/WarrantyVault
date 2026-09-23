import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS } from '../constants/enums.js';

export async function createCustomer({ actingUser, data, req }) {
  const customer = await Customer.create({ ...data, storeId: actingUser.storeId });

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.CUSTOMER_CREATED,
    entityType: 'Customer',
    entityId: customer._id,
    newValue: data,
    req,
  });

  return customer;
}

export async function listCustomers({ storeId, page, limit, search }) {
  const filter = { storeId, isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Customer.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getCustomerById({ storeId, customerId }) {
  const customer = await Customer.findOne({ _id: customerId, storeId });
  if (!customer) throw AppError.notFound('Customer not found');
  return customer;
}

export async function updateCustomer({ actingUser, customerId, updates, req }) {
  const customer = await Customer.findOne({ _id: customerId, storeId: actingUser.storeId });
  if (!customer) throw AppError.notFound('Customer not found');

  const oldValue = customer.toObject();
  Object.assign(customer, updates);
  await customer.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.CUSTOMER_UPDATED,
    entityType: 'Customer',
    entityId: customer._id,
    oldValue,
    newValue: customer.toObject(),
    req,
  });

  return customer;
}
