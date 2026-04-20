import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
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
import type { Profile } from './types'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

// Auth initializer — must be inside BrowserRouter so useNavigate works
function AuthProvider() {
  const { setUser, setProfile, setLoading, signOut } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data as Profile)
      }
      setLoading(false)
    })

    // Listen for sign in / sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
          setProfile(data as Profile)
          setLoading(false)
          // Navigate to role dashboard after login
          navigate(`/${data.role}`, { replace: true })
        } else {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        signOut()
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider />
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Doctor */}
          <Route path="/doctor" element={<RoleGuard allowedRoles={['doctor']}><AppShell><DoctorDashboard /></AppShell></RoleGuard>} />
          <Route path="/doctor/*" element={<RoleGuard allowedRoles={['doctor']}><AppShell><div className="text-center py-20 text-muted-foreground">Coming soon</div></AppShell></RoleGuard>} />

          {/* Assistant */}
          <Route path="/assistant" element={<RoleGuard allowedRoles={['assistant']}><AppShell><AssistantDashboard /></AppShell></RoleGuard>} />
          <Route path="/assistant/*" element={<RoleGuard allowedRoles={['assistant']}><AppShell><div className="text-center py-20 text-muted-foreground">Coming soon</div></AppShell></RoleGuard>} />

          {/* Admin */}
          <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AppShell><AdminDashboard /></AppShell></RoleGuard>} />
          <Route path="/admin/*" element={<RoleGuard allowedRoles={['admin']}><AppShell><div className="text-center py-20 text-muted-foreground">Coming soon</div></AppShell></RoleGuard>} />

          {/* Accountant */}
          <Route path="/accountant" element={<RoleGuard allowedRoles={['accountant']}><AppShell><AccountantDashboard /></AppShell></RoleGuard>} />
          <Route path="/accountant/*" element={<RoleGuard allowedRoles={['accountant']}><AppShell><div className="text-center py-20 text-muted-foreground">Coming soon</div></AppShell></RoleGuard>} />

          {/* Shared */}
          <Route path="/chat" element={<RoleGuard><AppShell><div className="text-center py-20 text-muted-foreground">Chat coming soon</div></AppShell></RoleGuard>} />
          <Route path="/settings" element={<RoleGuard><AppShell><div className="text-center py-20 text-muted-foreground">Settings coming soon</div></AppShell></RoleGuard>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
