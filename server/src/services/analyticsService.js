import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Warranty } from '../models/Warranty.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { WarrantyClaim } from '../models/WarrantyClaim.js';
import { SERVICE_STATUSES, CLAIM_STATUSES } from '../constants/enums.js';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardSummary(storeId) {
  const storeObjId = new mongoose.Types.ObjectId(storeId);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [todaySalesAgg, monthSalesAgg, totalInvoices, activeWarranties, expiringWarranties, serviceRequestCount, pendingClaims, completedServices] =
    await Promise.all([
      Invoice.aggregate([
        { $match: { storeId: storeObjId, purchaseDate: { $gte: startOfDay() } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { storeId: storeObjId, purchaseDate: { $gte: startOfMonth(now) } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Invoice.countDocuments({ storeId: storeObjId }),
      Warranty.countDocuments({ storeId: storeObjId, endDate: { $gt: now } }),
      Warranty.countDocuments({ storeId: storeObjId, endDate: { $gt: now, $lte: in30Days } }),
      ServiceRequest.countDocuments({ storeId: storeObjId }),
      WarrantyClaim.countDocuments({ storeId: storeObjId, status: CLAIM_STATUSES.PENDING }),
      ServiceRequest.countDocuments({ storeId: storeObjId, status: SERVICE_STATUSES.COMPLETED }),
    ]);

  return {
    todaySales: todaySalesAgg[0]?.total || 0,
    todayInvoiceCount: todaySalesAgg[0]?.count || 0,
    monthlySales: monthSalesAgg[0]?.total || 0,
    monthlyInvoiceCount: monthSalesAgg[0]?.count || 0,
    totalInvoices,
    activeWarranties,
    expiringThisMonth: expiringWarranties,
    serviceRequests: serviceRequestCount,
    pendingClaims,
    completedServices,
  };
}

export async function getSalesTrend(storeId, days = 30) {
  const storeObjId = new mongoose.Types.ObjectId(storeId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return Invoice.aggregate([
    { $match: { storeId: storeObjId, purchaseDate: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } },
        total: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', total: 1, count: 1 } },
  ]);
}

export async function getTopProducts(storeId, limit = 10) {
  const storeObjId = new mongoose.Types.ObjectId(storeId);
  return Invoice.aggregate([
    { $match: { storeId: storeObjId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);
}

/**
 * Product failure / service rate: (service requests for a product) /
 * (units sold) — flags products with unusually high service rates (spec §18).
 */
export async function getProductFailureAnalytics(storeId) {
  const storeObjId = new mongoose.Types.ObjectId(storeId);

  const unitsSold = await Invoice.aggregate([
    { $match: { storeId: storeObjId } },
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', name: { $first: '$items.name' }, unitsSold: { $sum: '$items.quantity' } } },
  ]);

  const serviceCounts = await ServiceRequest.aggregate([
    { $match: { storeId: storeObjId } },
    { $group: { _id: '$productId', serviceRequests: { $sum: 1 } } },
  ]);
  const serviceMap = new Map(serviceCounts.map((s) => [s._id.toString(), s.serviceRequests]));

  return unitsSold
    .map((p) => {
      const serviceRequests = serviceMap.get(p._id.toString()) || 0;
      const failureRate = p.unitsSold > 0 ? (serviceRequests / p.unitsSold) * 100 : 0;
      return { productId: p._id, name: p.name, unitsSold: p.unitsSold, serviceRequests, failureRate: Number(failureRate.toFixed(2)) };
    })
    .sort((a, b) => b.failureRate - a.failureRate);
}

export async function getWarrantyClaimsTrend(storeId, days = 90) {
  const storeObjId = new mongoose.Types.ObjectId(storeId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return WarrantyClaim.aggregate([
    { $match: { storeId: storeObjId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        rejected: { $sum: { $cond: [{ $eq: ['$status', CLAIM_STATUSES.REJECTED] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', total: 1, rejected: 1 } },
  ]);
}
