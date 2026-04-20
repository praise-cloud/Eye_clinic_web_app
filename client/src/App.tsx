import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { AdminDashboard } from './pages/admin/Dashboard'
import { DoctorDashboard } from './pages/doctor/Dashboard'
import { AssistantDashboard } from './pages/assistant/Dashboard'
import { AccountantDashboard } from './pages/accountant/Dashboard'
import { PatientsPage } from './pages/patients/PatientsPage'
import { PatientDetailPage } from './pages/patients/PatientDetailPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function RoleDashboard() {
  const { user } = useAuthStore()
  
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'doctor':
      return <DoctorDashboard />
    case 'assistant':
      return <AssistantDashboard />
    case 'accountant':
      return <AccountantDashboard />
    default:
      return <AdminDashboard />
  }
}

function App() {
  const { logout } = useAuthStore()
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout onLogout={logout}>
              <Routes>
                <Route path="/" element={<RoleDashboard />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/patients/:id" element={<PatientDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Role-specific routes can be added here */}
                <Route path="/case-studies" element={<RoleDashboard />} />
                <Route path="/revenue" element={<RoleDashboard />} />
                <Route path="/inventory" element={<RoleDashboard />} />
                <Route path="/pharmacy" element={<RoleDashboard />} />
                <Route path="/prescriptions" element={<RoleDashboard />} />
                <Route path="/case-notes" element={<RoleDashboard />} />
                <Route path="/messages" element={<RoleDashboard />} />
                
                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App