import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { RoleGuard } from './components/layout/RoleGuard'
import { AppShell } from './components/layout/AppShell'
import type { Profile } from './types'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications'

// Pages
import { SplashScreen } from './pages/SplashScreen'
import { LoginPage } from './pages/auth/LoginPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { AssistantDashboard } from './pages/assistant/AssistantDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AccountantDashboard } from './pages/accountant/AccountantDashboard'
import { PatientsPage } from './pages/patients/PatientsPage'
import { PatientDetailPage } from './pages/patients/PatientDetailPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { CaseNotesPage } from './pages/doctor/CaseNotesPage'
import { PrescriptionsPage } from './pages/doctor/PrescriptionsPage'
import { DispensingPage } from './pages/assistant/DispensingPage'
import { GlassesOrdersPage } from './pages/assistant/GlassesOrdersPage'
import { InventoryPage } from './pages/admin/InventoryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { AuditPage } from './pages/admin/AuditPage'
import { PaymentsPage } from './pages/accountant/PaymentsPage'
import { DailySummaryPage } from './pages/accountant/DailySummaryPage'
import { SubscriptionsPage } from './pages/accountant/SubscriptionsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ChatPage } from './pages/chat/ChatPage'
import { OutreachPage } from './pages/assistant/OutreachPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

function AuthProvider() {
  const { setUser, setProfile, setLoading, signOut } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data as Profile)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const { data } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single()
          if (data) {
            setProfile(data as Profile)
            setLoading(false)
            navigate(`/${data.role}`, { replace: true })
          } else {
            // Profile missing — create from metadata
            const meta = session.user.user_metadata
            const role = meta?.role ?? 'assistant'
            const full_name = meta?.full_name ?? session.user.email ?? 'User'
            await supabase.from('profiles').upsert({
              id: session.user.id, full_name, role, is_active: true,
            })
            const newProfile = { id: session.user.id, full_name, role, is_active: true, created_at: '', updated_at: '' } as Profile
            setProfile(newProfile)
            setLoading(false)
            navigate(`/${role}`, { replace: true })
          }
        } catch (e) {
          console.error('Profile fetch error:', e)
          setLoading(false)
          navigate('/login', { replace: true })
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

// Realtime notifications — mounts once after auth resolves
function RealtimeProvider() {
  useRealtimeNotifications()
  return null
}

// Wrap a page in AppShell with role guard
const P = ({ roles, children }: { roles?: Profile['role'][]; children: React.ReactNode }) => (
  <RoleGuard allowedRoles={roles}>
    <AppShell>{children}</AppShell>
  </RoleGuard>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider />
        <RealtimeProvider />
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Shared protected */}
          <Route path="/patients" element={<P><PatientsPage /></P>} />
          <Route path="/patients/:id" element={<P><PatientDetailPage /></P>} />
          <Route path="/settings" element={<P><SettingsPage /></P>} />

          {/* Doctor */}
          <Route path="/doctor" element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/patients" element={<P roles={['doctor']}><PatientsPage /></P>} />
          <Route path="/doctor/appointments" element={<P roles={['doctor']}><AppointmentsPage /></P>} />
          <Route path="/doctor/case-notes" element={<P roles={['doctor']}><CaseNotesPage /></P>} />
          <Route path="/doctor/prescriptions" element={<P roles={['doctor']}><PrescriptionsPage /></P>} />

          {/* Assistant */}
          <Route path="/assistant" element={<P roles={['assistant']}><AssistantDashboard /></P>} />
          <Route path="/assistant/patients" element={<P roles={['assistant']}><PatientsPage /></P>} />
          <Route path="/assistant/appointments" element={<P roles={['assistant']}><AppointmentsPage /></P>} />
          <Route path="/assistant/dispensing" element={<P roles={['assistant']}><DispensingPage /></P>} />
          <Route path="/assistant/glasses-orders" element={<P roles={['assistant']}><GlassesOrdersPage /></P>} />

          {/* Admin */}
          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/patients" element={<P roles={['admin']}><PatientsPage /></P>} />
          <Route path="/admin/inventory" element={<P roles={['admin']}><InventoryPage /></P>} />
          <Route path="/admin/users" element={<P roles={['admin']}><UsersPage /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><ReportsPage /></P>} />

          {/* Accountant */}
          <Route path="/accountant" element={<P roles={['accountant']}><AccountantDashboard /></P>} />
          <Route path="/accountant/payments" element={<P roles={['accountant']}><PaymentsPage /></P>} />
          <Route path="/accountant/summary" element={<P roles={['accountant']}><DailySummaryPage /></P>} />
          <Route path="/accountant/subscriptions" element={<P roles={['accountant']}><SubscriptionsPage /></P>} />

          {/* Admin extras */}
          <Route path="/admin/audit" element={<P roles={['admin']}><AuditPage /></P>} />

          {/* Assistant extras */}
          <Route path="/assistant/outreach" element={<P roles={['assistant']}><OutreachPage /></P>} />

          {/* Shared chat */}
          <Route path="/chat" element={<P><ChatPage /></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
