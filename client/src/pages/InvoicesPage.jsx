import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { invoiceApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: () => invoiceApi.list({ limit: 50 }) });

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'customer', header: 'Customer', render: (r) => r.customerId?.name || '—' },
    { key: 'grandTotal', header: 'Total', render: (r) => `₹${r.grandTotal.toLocaleString()}` },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'purchaseDate', header: 'Date', render: (r) => new Date(r.purchaseDate).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Every completed sale, with its auto-registered warranty."
        action={
          <button
            onClick={() => navigate('/app/billing')}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> New bill
          </button>
        }
      />
      <DataTable
        columns={columns}
        rows={data?.data?.invoices || []}
        isLoading={isLoading}
        emptyMessage="No invoices yet — create your first bill."
        onRowClick={(row) => navigate(`/app/invoices/${row._id}`)}
      />
    </div>
  );
}
