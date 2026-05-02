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
import { DispensingPage } from './pages/assistant/DispensingPage'
import { GlassesOrdersPage } from './pages/assistant/GlassesOrdersPage'
import { GlassesPrescriptionPage } from './pages/assistant/GlassesPrescriptionPage'
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
          setProfile(data as Profile)
        } else {
          const meta = session.user.user_metadata
          const role = (meta?.role ?? 'assistant') as Profile['role']
          const full_name = meta?.full_name ?? session.user.email?.split('@')[0] ?? 'User'
          const { data: np } = await supabase.from('profiles').upsert({ id: session.user.id, full_name, role, is_active: true }, { onConflict: 'id' }).select().single()
          if (np) setProfile(np as Profile)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (data) {
            setProfile(data as Profile); setLoading(false)
            navigate(`/${data.role}`, { replace: true })
          } else {
            const meta = session.user.user_metadata
            const role = (meta?.role ?? 'assistant') as Profile['role']
            const full_name = meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? 'User'
            const { data: np } = await supabase.from('profiles').upsert({ id: session.user.id, full_name, role, is_active: true }, { onConflict: 'id' }).select().single()
            setProfile((np ?? { id: session.user.id, full_name, role, is_active: true, created_at: '', updated_at: '' }) as Profile)
            setLoading(false)
            navigate(`/${role}`, { replace: true })
          }
        } catch { setLoading(false); navigate('/login', { replace: true }) }
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setProfile(null); signOut()
        navigate('/login', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}

function RealtimeProvider() {
  useRealtimeNotifications()
  return null
}

const P = ({ roles, children }: { roles?: Profile['role'][]; children: React.ReactNode }) => (
  <RoleGuard allowedRoles={roles}><AppShell>{children}</AppShell></RoleGuard>
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

          {/* Shared */}
          <Route path="/patients" element={<P><PatientsPage /></P>} />
          <Route path="/patients/:id" element={<P><PatientDetailPage /></P>} />
          <Route path="/settings" element={<P><SettingsPage /></P>} />
          <Route path="/chat" element={<P><ChatPage /></P>} />

          {/* Doctor */}
          <Route path="/doctor" element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/patients" element={<P roles={['doctor']}><PatientsPage /></P>} />
          <Route path="/doctor/appointments" element={<P roles={['doctor']}><AppointmentsPage /></P>} />
          <Route path="/doctor/case-notes" element={<P roles={['doctor']}><CaseNotesPage /></P>} />

          {/* Frontdesk */}
          <Route path="/frontdesk" element={<P roles={['frontdesk']}><AssistantDashboard /></P>} />
          <Route path="/frontdesk/patients" element={<P roles={['frontdesk']}><PatientsPage /></P>} />
          <Route path="/frontdesk/appointments" element={<P roles={['frontdesk']}><AppointmentsPage /></P>} />
          <Route path="/frontdesk/dispensing" element={<P roles={['frontdesk']}><DispensingPage /></P>} />
          <Route path="/frontdesk/glasses-orders" element={<P roles={['frontdesk']}><GlassesOrdersPage /></P>} />
          <Route path="/frontdesk/prescriptions" element={<P roles={['frontdesk']}><GlassesPrescriptionPage /></P>} />
          <Route path="/frontdesk/inventory" element={<P roles={['frontdesk']}><InventoryPage /></P>} />
          <Route path="/frontdesk/outreach" element={<P roles={['frontdesk']}><OutreachPage /></P>} />

          {/* Manager */}
          <Route path="/manager" element={<P roles={['manager']}><ManagerDashboard /></P>} />
          <Route path="/manager/patients" element={<P roles={['manager']}><PatientsPage /></P>} />
          <Route path="/manager/appointments" element={<P roles={['manager']}><AppointmentsPage /></P>} />
          <Route path="/manager/users" element={<P roles={['manager']}><UsersPage /></P>} />
          <Route path="/manager/reports" element={<P roles={['manager']}><ReportsPage /></P>} />
          <Route path="/manager/audit" element={<P roles={['manager']}><AuditPage /></P>} />

          {/* Admin */}
          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/patients" element={<P roles={['admin']}><PatientsPage /></P>} />
          <Route path="/admin/inventory" element={<P roles={['admin']}><InventoryPage /></P>} />
          <Route path="/admin/users" element={<P roles={['admin']}><UsersPage /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><ReportsPage /></P>} />
          <Route path="/admin/audit" element={<P roles={['admin']}><AuditPage /></P>} />

          {/* Accountant */}
          <Route path="/accountant" element={<P roles={['accountant']}><AccountantDashboard /></P>} />
          <Route path="/accountant/payments" element={<P roles={['accountant']}><PaymentsPage /></P>} />
          <Route path="/accountant/summary" element={<P roles={['accountant']}><DailySummaryPage /></P>} />
          <Route path="/accountant/subscriptions" element={<P roles={['accountant']}><SubscriptionsPage /></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
