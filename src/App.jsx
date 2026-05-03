import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, RoleRoute, PublicRoute } from './routes/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import PaymentReturn from './pages/PaymentReturn'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSettings from './pages/admin/Settings'

// Landlord
import LandlordDashboard from './pages/landlord/Dashboard'
import LandlordProperties from './pages/landlord/Properties'
import LandlordLeases from './pages/landlord/Leases'
import LandlordInvoices from './pages/landlord/Invoices'
import LandlordPayments from './pages/landlord/Payments'
import LandlordReports from './pages/landlord/Reports'

// Tenant
import TenantDashboard from './pages/tenant/Dashboard'
import TenantInvoices from './pages/tenant/Invoices'
import TenantPayments from './pages/tenant/Payments'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/connexion" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/inscription" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/paiement/retour" element={<ProtectedRoute><PaymentReturn /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<RoleRoute roles={['admin']}><DashboardLayout /></RoleRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="utilisateurs" element={<AdminUsers />} />
            <Route path="parametres" element={<AdminSettings />} />
            <Route path="proprietes" element={<LandlordProperties />} />
            <Route path="baux" element={<LandlordLeases />} />
            <Route path="paiements" element={<LandlordPayments />} />
            <Route path="rapports" element={<LandlordReports />} />
          </Route>

          {/* Landlord */}
          <Route path="/proprietaire" element={<RoleRoute roles={['proprietaire']}><DashboardLayout /></RoleRoute>}>
            <Route index element={<LandlordDashboard />} />
            <Route path="proprietes" element={<LandlordProperties />} />
            <Route path="baux" element={<LandlordLeases />} />
            <Route path="factures" element={<LandlordInvoices />} />
            <Route path="paiements" element={<LandlordPayments />} />
            <Route path="rapports" element={<LandlordReports />} />
          </Route>

          {/* Tenant */}
          <Route path="/locataire" element={<RoleRoute roles={['locataire']}><DashboardLayout /></RoleRoute>}>
            <Route index element={<TenantDashboard />} />
            <Route path="baux" element={<TenantDashboard />} />
            <Route path="factures" element={<TenantInvoices />} />
            <Route path="paiements" element={<TenantPayments />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
