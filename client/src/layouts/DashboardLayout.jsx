import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  UserCog,
  Store,
  LogOut,
  ShieldCheck,
  Receipt,
  ShoppingCart,
  Wrench,
  BarChart3,
  History,
  Bell,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_BY_ROLE = {
  OWNER: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/billing', label: 'Billing', icon: ShoppingCart },
    { to: '/app/invoices', label: 'Invoices', icon: Receipt },
    { to: '/app/products', label: 'Products', icon: Package },
    { to: '/app/customers', label: 'Customers', icon: Users },
    { to: '/app/warranties', label: 'Warranties', icon: ShieldCheck },
    { to: '/app/service-requests', label: 'Service Requests', icon: Wrench },
    { to: '/app/employees', label: 'Employees', icon: UserCog },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/audit-logs', label: 'Audit Logs', icon: History },
    { to: '/app/store', label: 'Store Settings', icon: Store },
  ],
  MANAGER: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/billing', label: 'Billing', icon: ShoppingCart },
    { to: '/app/invoices', label: 'Invoices', icon: Receipt },
    { to: '/app/products', label: 'Products', icon: Package },
    { to: '/app/customers', label: 'Customers', icon: Users },
    { to: '/app/warranties', label: 'Warranties', icon: ShieldCheck },
    { to: '/app/service-requests', label: 'Service Requests', icon: Wrench },
    { to: '/app/employees', label: 'Employees', icon: UserCog },
    { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/app/audit-logs', label: 'Audit Logs', icon: History },
  ],
  CASHIER: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/billing', label: 'Billing', icon: ShoppingCart },
    { to: '/app/invoices', label: 'Invoices', icon: Receipt },
    { to: '/app/products', label: 'Products', icon: Package },
    { to: '/app/customers', label: 'Customers', icon: Users },
  ],
  TECHNICIAN: [
    { to: '/app', label: 'My Assignments', icon: LayoutDashboard, end: true },
  ],
  CUSTOMER: [
    { to: '/app', label: 'My Products', icon: LayoutDashboard, end: true },
    { to: '/app/purchases', label: 'My Purchases', icon: Receipt },
    { to: '/app/warranties', label: 'My Warranties', icon: ShieldCheck },
    { to: '/app/service-requests', label: 'Service Requests', icon: ClipboardList },
    { to: '/app/notifications', label: 'Notifications', icon: Bell },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
          <span className="font-semibold text-slate-900">DigiWarranty</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
