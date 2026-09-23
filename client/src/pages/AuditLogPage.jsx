import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({ queryKey: ['audit-logs'], queryFn: () => auditLogApi.list({ limit: 50 }) });

  const columns = [
    { key: 'timestamp', header: 'When', render: (r) => new Date(r.timestamp).toLocaleString() },
    { key: 'action', header: 'Action', render: (r) => r.action.replaceAll('_', ' ') },
    { key: 'user', header: 'By', render: (r) => `${r.userId?.name || '—'} (${r.userId?.role || ''})` },
    { key: 'entityType', header: 'Entity' },
    {
      key: 'change',
      header: 'Change',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {r.oldValue ? `${JSON.stringify(r.oldValue)} → ` : ''}
          {r.newValue ? JSON.stringify(r.newValue) : ''}
          {r.reason ? ` (${r.reason})` : ''}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every sensitive change, who made it, and why." />
      <DataTable columns={columns} rows={data?.data?.logs || []} isLoading={isLoading} emptyMessage="No audit entries yet." />
    </div>
  );
}
