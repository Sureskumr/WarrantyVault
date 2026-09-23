import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { portalApi } from '../api/opsApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import WarrantyProgressBar from '../components/WarrantyProgressBar.jsx';

export default function PortalHomePage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['portal-warranties'], queryFn: () => portalApi.warranties({ limit: 20 }) });
  const warranties = data?.data?.warranties || [];

  return (
    <div>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Never lose a warranty because you lost a bill." />

      {isLoading && <p className="text-sm text-slate-500">Loading your products…</p>}

      {!isLoading && !warranties.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No purchases linked to your account yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warranties.map((w) => (
          <div key={w._id} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-slate-900">{w.productId?.name}</p>
            <p className="text-xs text-slate-400">{w.storeId?.storeName}</p>
            <div className="my-3">
              <StatusBadge status={w.status} />
            </div>
            <WarrantyProgressBar duration={w.duration} durationUnit={w.durationUnit} daysRemaining={w.daysRemaining} status={w.status} />
            <p className="mt-2 text-xs text-slate-400">Expires: {new Date(w.endDate).toLocaleDateString()}</p>
            <div className="mt-4 flex gap-3 text-xs font-medium">
              <Link to="/app/purchases" className="text-brand-600 hover:underline">
                View Invoice
              </Link>
              <Link to="/app/service-requests" className="text-brand-600 hover:underline">
                Request Service
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
