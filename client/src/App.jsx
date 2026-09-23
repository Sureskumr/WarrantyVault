import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import {
  RequireAuth,
  RequireRole,
  FullScreenSpinner,
} from "./routes/guards.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RegisterCustomerPage from "./pages/RegisterCustomerPage.jsx";
import DashboardHomePage from "./pages/DashboardHomePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import StoreSettingsPage from "./pages/StoreSettingsPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import InvoicesPage from "./pages/InvoicesPage.jsx";
import InvoiceDetailPage from "./pages/InvoiceDetailPage.jsx";
import WarrantiesPage from "./pages/WarrantiesPage.jsx";
import ServiceRequestsPage from "./pages/ServiceRequestsPage.jsx";
import ServiceRequestDetailPage from "./pages/ServiceRequestDetailPage.jsx";
import TechnicianDashboardPage from "./pages/TechnicianDashboardPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import AuditLogPage from "./pages/AuditLogPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import PortalHomePage from "./pages/PortalHomePage.jsx";
import PortalPurchasesPage from "./pages/PortalPurchasesPage.jsx";
import PortalWarrantiesPage from "./pages/PortalWarrantiesPage.jsx";
import PortalServiceRequestsPage from "./pages/PortalServiceRequestsPage.jsx";
import PortalNotificationsPage from "./pages/PortalNotificationsPage.jsx";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenSpinner />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

// The dashboard "home" route differs by role: technicians land on their
// assignment queue, customers on their product cards, staff on stats.
function RoleAwareHome() {
  const { user } = useAuth();
  if (user.role === "TECHNICIAN") return <TechnicianDashboardPage />;
  if (user.role === "CUSTOMER") return <PortalHomePage />;
  return <DashboardHomePage />;
}

// /app/warranties and /app/service-requests are shared nav entries for both
// staff/technicians and customers, but show a different page component —
// staff sees store-wide records, customers see only their own.
function RoleAwareWarranties() {
  const { user } = useAuth();
  return user.role === "CUSTOMER" ? (
    <PortalWarrantiesPage />
  ) : (
    <WarrantiesPage />
  );
}
function RoleAwareServiceRequests() {
  const { user } = useAuth();
  return user.role === "CUSTOMER" ? (
    <PortalServiceRequestsPage />
  ) : (
    <ServiceRequestsPage />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register-customer"
        element={
          <PublicOnlyRoute>
            <RegisterCustomerPage />
          </PublicOnlyRoute>
        }
      />

      {/* Public — no auth, supports QR verification and OTP-confirmed warranty lookup */}
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/invoice/:token" element={<VerifyPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<RoleAwareHome />} />

          {/* Staff: billing → invoices → products → customers */}
          <Route
            element={<RequireRole roles={["OWNER", "MANAGER", "CASHIER"]} />}
          >
            <Route path="billing" element={<BillingPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="customers" element={<CustomersPage />} />
          </Route>

          {/* Shared path, role-aware component: staff/technicians see store-wide
              records, customers see only their own. */}
          <Route
            element={
              <RequireRole
                roles={[
                  "OWNER",
                  "MANAGER",
                  "CASHIER",
                  "TECHNICIAN",
                  "CUSTOMER",
                ]}
              />
            }
          >
            <Route path="warranties" element={<RoleAwareWarranties />} />
            <Route
              path="service-requests"
              element={<RoleAwareServiceRequests />}
            />
          </Route>
          <Route
            element={
              <RequireRole
                roles={["OWNER", "MANAGER", "CASHIER", "TECHNICIAN"]}
              />
            }
          >
            <Route
              path="service-requests/:id"
              element={<ServiceRequestDetailPage />}
            />
          </Route>

          <Route element={<RequireRole roles={["OWNER", "MANAGER"]} />}>
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
          </Route>
          <Route element={<RequireRole roles={["OWNER"]} />}>
            <Route path="store" element={<StoreSettingsPage />} />
          </Route>

          {/* Customer portal (remaining pages not covered by the shared paths above) */}
          <Route element={<RequireRole roles={["CUSTOMER"]} />}>
            <Route path="purchases" element={<PortalPurchasesPage />} />
            <Route path="notifications" element={<PortalNotificationsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
