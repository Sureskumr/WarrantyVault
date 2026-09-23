import { useQuery } from '@tanstack/react-query';
import { portalApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import WarrantyProgressBar from '../components/WarrantyProgressBar.jsx';

export default function PortalWarrantiesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-warranties-list'], queryFn: () => portalApi.warranties({ limit: 50 }) });

  const columns = [
    { key: 'product', header: 'Product', render: (r) => r.productId?.name || '—' },
    { key: 'store', header: 'Store', render: (r) => r.storeId?.storeName || '—' },
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
      <PageHeader title="My Warranties" subtitle="Every warranty tied to your purchases." />
      <DataTable columns={columns} rows={data?.data?.warranties || []} isLoading={isLoading} emptyMessage="No warranties yet." />
    </div>
  );
}
