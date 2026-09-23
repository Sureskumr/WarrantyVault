import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { technicianApi, serviceApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function TechnicianDashboardPage() {
  const navigate = useNavigate();
  const { data: dash } = useQuery({ queryKey: ['tech-dashboard'], queryFn: () => technicianApi.myDashboard() });
  const { data, isLoading } = useQuery({ queryKey: ['service-requests', 'mine'], queryFn: () => serviceApi.list({ limit: 50 }) });

  const stats = dash?.data || {};
  const columns = [
    { key: 'product', header: 'Product', render: (r) => r.productId?.name || '—' },
    { key: 'customer', header: 'Customer', render: (r) => r.customerId?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="My Assignments" subtitle="Service requests assigned to you." />

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Assigned" value={stats.assigned ?? '—'} />
        <StatCard label="Pending diagnosis" value={stats.pendingDiagnosis ?? '—'} />
        <StatCard label="In progress" value={stats.inProgress ?? '—'} />
        <StatCard label="Completed" value={stats.completed ?? '—'} />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data?.requests || []}
        isLoading={isLoading}
        emptyMessage="No requests assigned to you yet."
        onRowClick={(row) => navigate(`/app/service-requests/${row._id}`)}
      />
    </div>
  );
}
