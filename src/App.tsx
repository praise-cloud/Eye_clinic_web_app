import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { RoleGuard } from './components/layout/RoleGuard'
import { AppShell } from './components/layout/AppShell'
import { SplashScreen } from './pages/SplashScreen'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { AssistantDashboard } from './pages/assistant/AssistantDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AccountantDashboard } from './pages/accountant/AccountantDashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1 },
  },
})

function RootRedirect() {
  const { profile, isAuthenticated } = useAuthStore()
  if (isAuthenticated && profile) return <Navigate to={`/${profile.role}`} replace />
  return <SplashScreen />
}

function App() {
  useAuth() // Initialize auth listener

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/doctor" element={<RoleGuard allowedRoles={['doctor']}><AppShell><DoctorDashboard /></AppShell></RoleGuard>} />
          <Route path="/doctor/*" element={<RoleGuard allowedRoles={['doctor']}><AppShell><div className="text-center py-20 text-muted-foreground">Page under construction</div></AppShell></RoleGuard>} />

          <Route path="/assistant" element={<RoleGuard allowedRoles={['assistant']}><AppShell><AssistantDashboard /></AppShell></RoleGuard>} />
          <Route path="/assistant/*" element={<RoleGuard allowedRoles={['assistant']}><AppShell><div className="text-center py-20 text-muted-foreground">Page under construction</div></AppShell></RoleGuard>} />

          <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AppShell><AdminDashboard /></AppShell></RoleGuard>} />
          <Route path="/admin/*" element={<RoleGuard allowedRoles={['admin']}><AppShell><div className="text-center py-20 text-muted-foreground">Page under construction</div></AppShell></RoleGuard>} />

          <Route path="/accountant" element={<RoleGuard allowedRoles={['accountant']}><AppShell><AccountantDashboard /></AppShell></RoleGuard>} />
          <Route path="/accountant/*" element={<RoleGuard allowedRoles={['accountant']}><AppShell><div className="text-center py-20 text-muted-foreground">Page under construction</div></AppShell></RoleGuard>} />

          <Route path="/chat" element={<RoleGuard><AppShell><div className="text-center py-20 text-muted-foreground">Chat coming soon</div></AppShell></RoleGuard>} />
          <Route path="/settings" element={<RoleGuard><AppShell><div className="text-center py-20 text-muted-foreground">Settings coming soon</div></AppShell></RoleGuard>} />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
