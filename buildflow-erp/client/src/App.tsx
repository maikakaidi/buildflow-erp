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
import SyncPage from './pages/synchronisation/SyncPage';
import syncService from './api/sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
  },
});

const ROLE_ALL = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER'];
const ROLE_MANAGER = ['ADMIN', 'MANAGER'];
const ROLE_EMPLOYEE = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

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
            <Route path="dashboard" element={<RequireRole roles={ROLE_ALL}><DashboardPage /></RequireRole>} />
            <Route path="chantiers" element={<RequireRole roles={ROLE_ALL}><ChantiersPage /></RequireRole>} />
            <Route path="employees" element={<RequireRole roles={ROLE_EMPLOYEE}><EmployeesPage /></RequireRole>} />
            <Route path="workers" element={<RequireRole roles={ROLE_EMPLOYEE}><WorkersPage /></RequireRole>} />
            <Route path="presences" element={<RequireRole roles={ROLE_EMPLOYEE}><PresencesPage /></RequireRole>} />
            <Route path="salaries" element={<RequireRole roles={ROLE_MANAGER}><SalariesPage /></RequireRole>} />
            <Route path="contracts" element={<RequireRole roles={ROLE_MANAGER}><ContractsPage /></RequireRole>} />
            <Route path="stock" element={<RequireRole roles={ROLE_EMPLOYEE}><StockPage /></RequireRole>} />
            <Route path="stock-families" element={<RequireRole roles={ROLE_EMPLOYEE}><StockFamiliesPage /></RequireRole>} />
            <Route path="stock-movements" element={<RequireRole roles={ROLE_EMPLOYEE}><StockMovementsPage /></RequireRole>} />
            <Route path="materials" element={<RequireRole roles={ROLE_EMPLOYEE}><MaterialsPage /></RequireRole>} />
            <Route path="purchases" element={<RequireRole roles={ROLE_MANAGER}><PurchasesPage /></RequireRole>} />
            <Route path="expenses" element={<RequireRole roles={ROLE_MANAGER}><ExpensesPage /></RequireRole>} />
            <Route path="invoices" element={<RequireRole roles={ROLE_MANAGER}><InvoicesPage /></RequireRole>} />
            <Route path="payments" element={<RequireRole roles={ROLE_MANAGER}><PaymentsPage /></RequireRole>} />
            <Route path="suppliers" element={<RequireRole roles={ROLE_MANAGER}><SuppliersPage /></RequireRole>} />
            <Route path="clients" element={<RequireRole roles={ROLE_MANAGER}><ClientsPage /></RequireRole>} />
            <Route path="vehicles" element={<RequireRole roles={ROLE_MANAGER}><VehiclesPage /></RequireRole>} />
            <Route path="locations" element={<RequireRole roles={ROLE_MANAGER}><LocationsPage /></RequireRole>} />
            <Route path="documents" element={<RequireRole roles={ROLE_EMPLOYEE}><DocumentsPage /></RequireRole>} />
            <Route path="rapports" element={<RequireRole roles={ROLE_ALL}><RapportsPage /></RequireRole>} />
            <Route path="rapports/activite" element={<RequireRole roles={ROLE_ALL}><RapportActivitePage /></RequireRole>} />
            <Route path="rapports/stock" element={<RequireRole roles={ROLE_ALL}><RapportStockPage /></RequireRole>} />
            <Route path="rapports/chantier/:id" element={<RequireRole roles={ROLE_ALL}><ChantierDetailPage /></RequireRole>} />
            <Route path="rapports/employe/:id" element={<RequireRole roles={ROLE_ALL}><EmployeDetailPage /></RequireRole>} />
            <Route path="rapports/vehicule/:id" element={<RequireRole roles={ROLE_ALL}><VehiculeDetailPage /></RequireRole>} />
            <Route path="notifications" element={<RequireRole roles={ROLE_ALL}><NotificationsPage /></RequireRole>} />
            <Route path="users" element={<RequireRole roles={ROLE_MANAGER}><UsersPage /></RequireRole>} />
            <Route path="sync" element={<RequireRole roles={ROLE_MANAGER}><SyncPage /></RequireRole>} />
            <Route path="settings" element={<RequireRole roles={ROLE_MANAGER}><SettingsPage /></RequireRole>} />
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
