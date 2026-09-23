const STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CLAIMED: 'bg-blue-100 text-blue-700',
  SUSPENDED: 'bg-slate-200 text-slate-600',
  CANCELLED: 'bg-slate-200 text-slate-600',
  PENDING: 'bg-slate-100 text-slate-600',
  CREATED: 'bg-slate-100 text-slate-600',
  VERIFICATION_PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  TECHNICIAN_VISIT: 'bg-blue-100 text-blue-700',
  DIAGNOSIS: 'bg-amber-100 text-amber-700',
  REPAIR_IN_PROGRESS: 'bg-amber-100 text-amber-700',
  WAITING_FOR_PART: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED_SERVICE: 'bg-slate-200 text-slate-600',
  APPROVED: 'bg-blue-100 text-blue-700',
  IN_REPAIR: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {status?.replaceAll('_', ' ')}
    </span>
  );
}
