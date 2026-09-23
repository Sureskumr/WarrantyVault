import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTIONS } from '../constants/enums.js';

export async function createProduct({ actingUser, data, req }) {
  const product = await Product.create({ ...data, storeId: actingUser.storeId });

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.PRODUCT_CREATED,
    entityType: 'Product',
    entityId: product._id,
    newValue: data,
    req,
  });

  return product;
}

export async function listProducts({ storeId, page, limit, search, category }) {
  const filter = { storeId, isDeleted: false };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getProductById({ storeId, productId }) {
  const product = await Product.findOne({ _id: productId, storeId, isDeleted: false });
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

export async function updateProduct({ actingUser, productId, updates, req }) {
  const product = await Product.findOne({ _id: productId, storeId: actingUser.storeId, isDeleted: false });
  if (!product) throw AppError.notFound('Product not found');

  const oldValue = product.toObject();
  Object.assign(product, updates);
  await product.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.PRODUCT_UPDATED,
    entityType: 'Product',
    entityId: product._id,
    oldValue,
    newValue: product.toObject(),
    req,
  });

  return product;
}

/**
 * Products are soft-deleted (rule #13: a product with transaction history
 * must not disappear from historical invoices/warranties). We deactivate +
 * flag isDeleted rather than removing the document.
 */
export async function deleteProduct({ actingUser, productId, req }) {
  const product = await Product.findOne({ _id: productId, storeId: actingUser.storeId, isDeleted: false });
  if (!product) throw AppError.notFound('Product not found');

  product.isDeleted = true;
  product.isActive = false;
  await product.save();

  await recordAudit({
    userId: actingUser.id,
    storeId: actingUser.storeId,
    action: AUDIT_ACTIONS.PRODUCT_DELETED,
    entityType: 'Product',
    entityId: product._id,
    req,
  });

  return product;
}
