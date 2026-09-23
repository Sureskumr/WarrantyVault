import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: dash } = useQuery({ queryKey: ['analytics-dashboard'], queryFn: () => analyticsApi.dashboard() });
  const { data: trend } = useQuery({ queryKey: ['sales-trend'], queryFn: () => analyticsApi.salesTrend(30) });
  const { data: top } = useQuery({ queryKey: ['top-products'], queryFn: () => analyticsApi.topProducts(8) });
  const { data: failure, isLoading: failureLoading } = useQuery({ queryKey: ['product-failure'], queryFn: () => analyticsApi.productFailure() });

  const s = dash?.data || {};

  const failureColumns = [
    { key: 'name', header: 'Product' },
    { key: 'unitsSold', header: 'Sold' },
    { key: 'serviceRequests', header: 'Service Requests' },
    { key: 'failureRate', header: 'Service Rate', render: (r) => `${r.failureRate}%` },
  ];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Sales, warranty, and service performance across your store." />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's Sales" value={`₹${(s.todaySales || 0).toLocaleString()}`} />
        <StatCard label="Monthly Sales" value={`₹${(s.monthlySales || 0).toLocaleString()}`} />
        <StatCard label="Active Warranties" value={s.activeWarranties ?? '—'} />
        <StatCard label="Expiring This Month" value={s.expiringThisMonth ?? '—'} />
        <StatCard label="Total Invoices" value={s.totalInvoices ?? '—'} />
        <StatCard label="Service Requests" value={s.serviceRequests ?? '—'} />
        <StatCard label="Pending Claims" value={s.pendingClaims ?? '—'} />
        <StatCard label="Completed Services" value={s.completedServices ?? '—'} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Sales trend (30 days)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend?.data?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-slate-900">Top products by units sold</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top?.data?.products || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="unitsSold" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">Product failure / service rate</p>
        <DataTable columns={failureColumns} rows={failure?.data?.products || []} isLoading={failureLoading} emptyMessage="No sales data yet." />
      </div>
    </div>
  );
}
