import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { portalApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';

export default function PortalNotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-notifications'], queryFn: () => portalApi.notifications({ limit: 50 }) });
  const notifications = data?.data?.notifications || [];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Notifications" subtitle="Updates on your invoices, warranties, and service requests." />

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {!isLoading && !notifications.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n._id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">{n.title}</p>
              <p className="text-sm text-slate-600">{n.message}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
