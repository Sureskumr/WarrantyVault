import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as productService from '../services/productService.js';

export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct({ actingUser: req.user, data: req.body, req });
  return sendSuccess(res, { statusCode: 201, message: 'Product created', data: { product } });
});

export const listProducts = catchAsync(async (req, res) => {
  const result = await productService.listProducts({ storeId: req.user.storeId, ...req.query });
  return sendSuccess(res, {
    message: 'Products',
    data: { products: result.items },
    meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
  });
});

export const getProduct = catchAsync(async (req, res) => {
  const product = await productService.getProductById({ storeId: req.user.storeId, productId: req.params.id });
  return sendSuccess(res, { message: 'Product details', data: { product } });
});

export const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct({
    actingUser: req.user,
    productId: req.params.id,
    updates: req.body,
    req,
  });
  return sendSuccess(res, { message: 'Product updated', data: { product } });
});

export const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct({ actingUser: req.user, productId: req.params.id, req });
  return sendSuccess(res, { message: 'Product deleted' });
});
