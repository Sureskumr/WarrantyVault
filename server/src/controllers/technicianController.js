import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { ROLES, SERVICE_STATUSES } from '../constants/enums.js';

export const listTechnicians = catchAsync(async (req, res) => {
  const technicians = await User.find({ storeId: req.user.storeId, role: ROLES.TECHNICIAN, isActive: true }).select('name email phone');
  return sendSuccess(res, { message: 'Technicians', data: { technicians } });
});

export const myDashboard = catchAsync(async (req, res) => {
  const filter = { storeId: req.user.storeId, technicianId: req.user.id };
  const [assigned, pendingDiagnosis, inProgress, completed] = await Promise.all([
    ServiceRequest.countDocuments({ ...filter, status: SERVICE_STATUSES.ASSIGNED }),
    ServiceRequest.countDocuments({ ...filter, status: { $in: [SERVICE_STATUSES.TECHNICIAN_VISIT, SERVICE_STATUSES.DIAGNOSIS] } }),
    ServiceRequest.countDocuments({ ...filter, status: { $in: [SERVICE_STATUSES.REPAIR_IN_PROGRESS, SERVICE_STATUSES.WAITING_FOR_PART] } }),
    ServiceRequest.countDocuments({ ...filter, status: SERVICE_STATUSES.COMPLETED }),
  ]);

  return sendSuccess(res, {
    message: 'Technician dashboard',
    data: { assigned, pendingDiagnosis, inProgress, completed },
  });
});
