import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RoleGuard } from './components/layout/RoleGuard'
import { ToastContainer } from './components/layout/ToastContainer'
import { LoginPage } from './pages/auth/LoginPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { UsersPage } from './pages/admin/UsersPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { FrontdeskDashboard } from './pages/frontdesk/FrontdeskDashboard'
import { ManagerDashboard } from './pages/manager/ManagerDashboard'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import type { Profile } from './types'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <RoleGuard>
            {user && <Navigate to={getRoleDashboardPath(user)} replace />}
          </RoleGuard>
        }
      />

      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminRoutes />
          </RoleGuard>
        }
      />

      {/* Doctor Routes */}
      <Route 
        path="/doctor/*" 
        element={
          <RoleGuard allowedRoles={['doctor']}>
            <DoctorRoutes />
          </RoleGuard>
        }
      />

      {/* Frontdesk Routes */}
      <Route 
        path="/frontdesk/*" 
        element={
          <RoleGuard allowedRoles={['frontdesk']}>
            <FrontdeskRoutes />
          </RoleGuard>
        }
      />

      {/* Manager Routes */}
      <Route 
        path="/manager/*" 
        element={
          <RoleGuard allowedRoles={['manager']}>
            <ManagerRoutes />
          </RoleGuard>
        }
      />

      {/* Fallback */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/settings" element={<div>Admin Settings - Coming Soon</div>} />
      <Route path="/reports" element={<div>Admin Reports - Coming Soon</div>} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function DoctorRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DoctorDashboard />} />
      <Route path="/patients" element={<div>Doctor Patients - Coming Soon</div>} />
      <Route path="/appointments" element={<div>Doctor Appointments - Coming Soon</div>} />
      <Route path="/prescriptions" element={<div>Doctor Prescriptions - Coming Soon</div>} />
      <Route path="*" element={<Navigate to="/doctor" replace />} />
    </Routes>
  )
}

function FrontdeskRoutes() {
  return (
    <Routes>
      <Route path="/" element={<FrontdeskDashboard />} />
      <Route path="/patients" element={<div>Frontdesk Patients - Coming Soon</div>} />
      <Route path="/patients/register" element={<div>Patient Registration - Coming Soon</div>} />
      <Route path="/appointments" element={<div>Frontdesk Appointments - Coming Soon</div>} />
      <Route path="/appointments/new" element={<div>Book Appointment - Coming Soon</div>} />
      <Route path="/payments" element={<div>Frontdesk Payments - Coming Soon</div>} />
      <Route path="*" element={<Navigate to="/frontdesk" replace />} />
    </Routes>
  )
}

function ManagerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ManagerDashboard />} />
      <Route path="/users" element={<div>Manager Users - Coming Soon</div>} />
      <Route path="/reports" element={<div>Manager Reports - Coming Soon</div>} />
      <Route path="/schedule" element={<div>Staff Schedule - Coming Soon</div>} />
      <Route path="/settings" element={<div>Manager Settings - Coming Soon</div>} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  )
}

function getRoleDashboardPath(user: Profile): string {
  const rolePaths = {
    admin: '/admin',
    manager: '/manager',
    doctor: '/doctor',
    frontdesk: '/frontdesk'
  }
  return rolePaths[user.role] || '/dashboard'
}

function App() {
  // Check for existing auth on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        useAuthStore.getState().setUser(user)
        useAuthStore.getState().setToken(token)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          <AppRoutes />
          <ToastContainer />
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
