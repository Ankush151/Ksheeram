import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DeliveryLayout } from '@/components/layout/DeliveryLayout';

// Auth Pages
import { LoginPage } from '@/pages/LoginPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { CustomersPage } from '@/pages/admin/CustomersPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { SuppliersPage } from '@/pages/admin/SuppliersPage';
import { ProcurementPage } from '@/pages/admin/ProcurementPage';
import { InventoryPage } from '@/pages/admin/InventoryPage';
import { SubscriptionsPage } from '@/pages/admin/SubscriptionsPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { DeliveryManifestPage } from '@/pages/admin/DeliveryManifestPage';
import { BillingPage } from '@/pages/admin/BillingPage';
import { PaymentsReconciliationPage } from '@/pages/admin/PaymentsReconciliationPage';
import { WhatsAppRequestsPage } from '@/pages/admin/WhatsAppRequestsPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';

// Delivery Pages
import { AgentManifestPage } from '@/pages/delivery/AgentManifestPage';
import { AgentOrderDetailPage } from '@/pages/delivery/AgentOrderDetailPage';
import { AgentHistoryPage } from '@/pages/delivery/AgentHistoryPage';
import { AgentProfilePage } from '@/pages/delivery/AgentProfilePage';

// Smart Home Redirector
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'delivery_agent') {
    return <Navigate to="/delivery/manifest" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Route Group */}
        <Route
          path="/admin"
          element={
            <RouteGuard allowedRoles={['admin', 'operations_manager']}>
              <AdminLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="procurement" element={<ProcurementPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="deliveries" element={<DeliveryManifestPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="payments" element={<PaymentsReconciliationPage />} />
          <Route path="whatsapp" element={<WhatsAppRequestsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Delivery Agent Route Group */}
        <Route
          path="/delivery"
          element={
            <RouteGuard allowedRoles={['delivery_agent', 'admin']}>
              <DeliveryLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="/delivery/manifest" replace />} />
          <Route path="manifest" element={<AgentManifestPage />} />
          <Route path="orders/:id" element={<AgentOrderDetailPage />} />
          <Route path="history" element={<AgentHistoryPage />} />
          <Route path="profile" element={<AgentProfilePage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRouter;
