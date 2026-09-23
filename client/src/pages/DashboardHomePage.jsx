import { useQuery } from '@tanstack/react-query';
import { Package, Users, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { productApi, customerApi } from '../api/resourceApi.js';
import { analyticsApi } from '../api/opsApi.js';
import PageHeader from '../components/PageHeader.jsx';

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
        <Icon className="h-5 w-5 text-brand-600" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const canSeeAnalytics = ['OWNER', 'MANAGER'].includes(user.role);

  const { data: products } = useQuery({
    queryKey: ['products', 'count'],
    queryFn: () => productApi.list({ limit: 1 }),
    enabled: ['OWNER', 'MANAGER', 'CASHIER'].includes(user.role),
  });
  const { data: customers } = useQuery({
    queryKey: ['customers', 'count'],
    queryFn: () => customerApi.list({ limit: 1 }),
    enabled: ['OWNER', 'MANAGER', 'CASHIER'].includes(user.role),
  });
  const { data: dash } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => analyticsApi.dashboard(),
    enabled: canSeeAnalytics,
  });

  const s = dash?.data || {};

  return (
    <div>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Here's what's happening in your store today." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Products" value={products?.meta?.total ?? '—'} />
        <StatCard icon={Users} label="Customers" value={customers?.meta?.total ?? '—'} />
        <StatCard icon={FileText} label="Invoices" value={canSeeAnalytics ? s.totalInvoices ?? '—' : '—'} />
        <StatCard icon={ShieldCheck} label="Active Warranties" value={canSeeAnalytics ? s.activeWarranties ?? '—' : '—'} />
      </div>

      {canSeeAnalytics && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={FileText} label="Today's Sales" value={`₹${(s.todaySales || 0).toLocaleString()}`} />
          <StatCard icon={FileText} label="Monthly Sales" value={`₹${(s.monthlySales || 0).toLocaleString()}`} />
          <StatCard icon={ShieldCheck} label="Expiring This Month" value={s.expiringThisMonth ?? '—'} />
          <StatCard icon={FileText} label="Pending Claims" value={s.pendingClaims ?? '—'} />
        </div>
      )}
    </div>
  );
}
