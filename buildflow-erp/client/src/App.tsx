import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DynamicThemeWrapper from './components/common/DynamicThemeWrapper';
import MainLayout from './components/layout/MainLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ChantiersPage from './pages/chantiers/ChantiersPage';
import EmployeesPage from './pages/employes/EmployeesPage';
import WorkersPage from './pages/employes/WorkersPage';
import PresencesPage from './pages/presences/PresencesPage';
import SalariesPage from './pages/salaries/SalariesPage';
import StockPage from './pages/stocks/StockPage';
import SuppliersPage from './pages/fournisseurs/SuppliersPage';
import ClientsPage from './pages/clients/ClientsPage';
import PurchasesPage from './pages/achats/PurchasesPage';
import ExpensesPage from './pages/depenses/ExpensesPage';
import ContractsPage from './pages/contrats/ContractsPage';
import MaterialsPage from './pages/materiels/MaterialsPage';
import InvoicesPage from './pages/facturation/InvoicesPage';
import VehiclesPage from './pages/vehicules/VehiclesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import StockFamiliesPage from './pages/stocks/StockFamiliesPage';
import PaymentsPage from './pages/paiements/PaymentsPage';
import LocationsPage from './pages/locations/LocationsPage';
import DocumentsPage from './pages/documents/DocumentsPage';
import RapportsPage from './pages/rapports/RapportsPage';
import RapportActivitePage from './pages/rapports/RapportActivitePage';
import RapportStockPage from './pages/rapports/RapportStockPage';
import StockMovementsPage from './pages/stocks/StockMovementsPage';
import UsersPage from './pages/utilisateurs/UsersPage';
import ChantierDetailPage from './pages/rapports/chantier/ChantierDetailPage';
import EmployeDetailPage from './pages/rapports/employe/EmployeDetailPage';
import VehiculeDetailPage from './pages/rapports/vehicule/VehiculeDetailPage';
import SuperAdminDashboardPage from './pages/admin/SuperAdminDashboardPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import SuperAdminUsersPage from './pages/admin/UsersPage';
import SuperAdminPaymentsPage from './pages/admin/PaymentsPage';
import syncService from './api/sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

function SyncInitializer() {
  const { user } = useAuth();
  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      syncService.startAutoSync(30000);
      return () => syncService.stopSync();
    }
  }, [user]);
  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isSuperAdmin = user?.isSuperAdmin;

  return (
    <>
      <SyncInitializer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {isSuperAdmin ? (
          <Route path="/" element={<SuperAdminLayout />}>
            <Route index element={<Navigate to="/admin" replace />} />
            <Route path="admin" element={<SuperAdminDashboardPage />} />
            <Route path="admin/companies" element={<CompaniesPage />} />
            <Route path="admin/users" element={<SuperAdminUsersPage />} />
            <Route path="admin/payments" element={<SuperAdminPaymentsPage />} />
          </Route>
        ) : (
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chantiers" element={<ChantiersPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="presences" element={<PresencesPage />} />
            <Route path="salaries" element={<SalariesPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="stock-families" element={<StockFamiliesPage />} />
            <Route path="stock-movements" element={<StockMovementsPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="rapports/activite" element={<RapportActivitePage />} />
            <Route path="rapports/stock" element={<RapportStockPage />} />
            <Route path="rapports/chantier/:id" element={<ChantierDetailPage />} />
            <Route path="rapports/employe/:id" element={<EmployeDetailPage />} />
            <Route path="rapports/vehicule/:id" element={<VehiculeDetailPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DynamicThemeWrapper>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1d29',
                color: '#e4e6f0',
                border: '1px solid #2a2e3f',
                borderRadius: 12,
              },
            }}
          />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DynamicThemeWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}
