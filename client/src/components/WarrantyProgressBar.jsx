export default function WarrantyProgressBar({ duration, durationUnit, daysRemaining, status }) {
  const totalDays = durationUnit === 'YEARS' ? duration * 365 : durationUnit === 'MONTHS' ? duration * 30 : duration;
  const pct = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  const color = status === 'EXPIRED' ? 'bg-red-500' : status === 'EXPIRING_SOON' ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{daysRemaining} days remaining</p>
    </div>
  );
}
