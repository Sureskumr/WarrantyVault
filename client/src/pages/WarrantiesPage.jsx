import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { warrantyApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import WarrantyProgressBar from '../components/WarrantyProgressBar.jsx';

export default function WarrantiesPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['warranties', status],
    queryFn: () => warrantyApi.list({ limit: 50, status: status || undefined }),
  });

  const columns = [
    { key: 'product', header: 'Product', render: (r) => r.productId?.name || '—' },
    { key: 'customer', header: 'Customer', render: (r) => r.customerId?.name || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'progress',
      header: 'Remaining',
      render: (r) => (
        <div className="w-40">
          <WarrantyProgressBar duration={r.duration} durationUnit={r.durationUnit} daysRemaining={r.daysRemaining} status={r.status} />
        </div>
      ),
    },
    { key: 'endDate', header: 'Expires', render: (r) => new Date(r.endDate).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader title="Warranties" subtitle="Auto-registered from every eligible sale." />

      <div className="mb-4 flex gap-2">
        {['', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CLAIMED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${status === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s ? s.replaceAll('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={data?.data?.warranties || []} isLoading={isLoading} emptyMessage="No warranties yet." />
    </div>
  );
}
