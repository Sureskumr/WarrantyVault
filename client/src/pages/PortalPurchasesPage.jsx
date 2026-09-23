import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { portalApi } from '../api/opsApi.js';
import { downloadAuthenticatedFile } from '../api/download.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

export default function PortalPurchasesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal-invoices'], queryFn: () => portalApi.invoices({ limit: 50 }) });

  const download = async (invoice) => {
    try {
      await downloadAuthenticatedFile(`/portal/invoices/${invoice._id}/pdf`, `${invoice.invoiceNumber}.pdf`);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'store', header: 'Store', render: (r) => r.storeId?.storeName || '—' },
    { key: 'grandTotal', header: 'Total', render: (r) => `₹${r.grandTotal.toLocaleString()}` },
    { key: 'purchaseDate', header: 'Date', render: (r) => new Date(r.purchaseDate).toLocaleDateString() },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button onClick={() => download(r)} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="My Purchases" subtitle="Your digital proof of purchase, always available." />
      <DataTable columns={columns} rows={data?.data?.invoices || []} isLoading={isLoading} emptyMessage="No purchases yet." />
    </div>
  );
}
