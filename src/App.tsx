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
import { RegisterPage } from './pages/auth/RegisterPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { FrontdeskDashboard } from './pages/frontdesk/FrontdeskDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { ManagerDashboard } from './pages/manager/ManagerDashboard'
import { PatientsPage } from './pages/patients/PatientsPage'
import { PatientDetailPage } from './pages/patients/PatientDetailPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { CalendarPage } from './pages/appointments/CalendarPage'
import { CaseNotesPage } from './pages/doctor/CaseNotesPage'
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage'
import { DispensingPage } from './pages/frontdesk/DispensingPage'
import { GlassesOrdersPage } from './pages/frontdesk/GlassesOrdersPage'
import { GlassesPrescriptionPage } from './pages/frontdesk/GlassesPrescriptionPage'
import { ItemOrdersPage } from './pages/frontdesk/ItemOrdersPage'
import { InventoryPage } from './pages/admin/InventoryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { PaymentsPage } from './pages/admin/AccountantPaymentsPage'
import { DailySummaryPage } from './pages/admin/DailySummaryPage'
import { SubscriptionsPage } from './pages/admin/AccountantSubscriptionsPage'
import { AuditPage } from './pages/manager/AuditPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ChatPage } from './pages/chat/ChatPage'
import { OutreachPage } from './pages/frontdesk/OutreachPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

function AuthProvider() {
  const { setUser, setProfile, setLoading, signOut } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          setUser(session.user)
          const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          if (error) throw error
          if (data) {
            setProfile(data as Profile)
          } else {
            const meta = session.user.user_metadata
            const role = (meta?.role ?? 'frontdesk') as Profile['role']
            const full_name = meta?.full_name ?? session.user.email?.split('@')[0] ?? 'User'
            const { data: np, error: upsertError } = await supabase.from('profiles').upsert({ id: session.user.id, full_name, role, is_active: true }, { onConflict: 'id' }).select().maybeSingle()
            if (upsertError) throw upsertError
            if (np) setProfile(np as Profile)
          }
        }
      } catch (err) {
        console.error('AuthProvider getSession error:', err)
      } finally {
        setLoading(false)
      }
    }).catch((err) => {
      console.error('AuthProvider getSession failed:', err)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle token refresh and session restore (no redirect on SIGNED_IN - LoginPage handles that)
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user)
          try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
            if (error) throw error
            if (data) {
              setProfile(data as Profile)
            } else {
              const meta = session.user.user_metadata
              const role = (meta?.role ?? 'frontdesk') as Profile['role']
              const full_name = meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? 'User'
              const { data: np, error: upsertError } = await supabase.from('profiles').upsert({ id: session.user.id, email: session.user.email, full_name, role, is_active: true }, { onConflict: 'id' }).select().maybeSingle()
              if (upsertError) throw upsertError
              if (np) setProfile(np as Profile)
            }
          } catch (err) {
            console.error('AuthProvider session restore error:', err)
          } finally {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        setUser(null); setProfile(null); signOut()
        navigate('/login', { replace: true })
      }
      // Note: SIGNED_IN is handled by LoginPage.tsx, not here
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
          <Route path="/register" element={<RegisterPage />} />

          {/* Shared */}
          <Route path="/patients" element={<P><PatientsPage /></P>} />
          <Route path="/patients/:id" element={<P><PatientDetailPage /></P>} />
          <Route path="/settings" element={<P><SettingsPage /></P>} />
          <Route path="/chat" element={<P><ChatPage /></P>} />

          {/* Doctor */}
          <Route path="/doctor" element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/patients" element={<P roles={['doctor']}><PatientsPage /></P>} />
          <Route path="/doctor/appointments" element={<P roles={['doctor']}><AppointmentsPage /></P>} />
          <Route path="/doctor/calendar" element={<P roles={['doctor']}><CalendarPage /></P>} />
          <Route path="/doctor/case-notes" element={<P roles={['doctor']}><CaseNotesPage /></P>} />
          <Route path="/doctor/prescriptions" element={<P roles={['doctor']}><DoctorPrescriptionsPage /></P>} />
          
           {/* Frontdesk */}
           <Route path="/frontdesk" element={<P roles={['frontdesk']}><FrontdeskDashboard /></P>} />
          <Route path="/frontdesk/patients" element={<P roles={['frontdesk']}><PatientsPage /></P>} />
          <Route path="/frontdesk/appointments" element={<P roles={['frontdesk']}><AppointmentsPage /></P>} />
          <Route path="/frontdesk/calendar" element={<P roles={['frontdesk']}><CalendarPage /></P>} />
          <Route path="/frontdesk/dispensing" element={<P roles={['frontdesk']}><DispensingPage /></P>} />
          <Route path="/frontdesk/glasses-orders" element={<P roles={['frontdesk']}><GlassesOrdersPage /></P>} />
          <Route path="/frontdesk/prescriptions" element={<P roles={['frontdesk']}><GlassesPrescriptionPage /></P>} />
          <Route path="/frontdesk/inventory" element={<P roles={['frontdesk']}><InventoryPage /></P>} />
          <Route path="/frontdesk/item-orders" element={<P roles={['frontdesk']}><ItemOrdersPage /></P>} />
          <Route path="/frontdesk/outreach" element={<P roles={['frontdesk']}><OutreachPage /></P>} />

          {/* Legacy assistant aliases */}
          <Route path="/assistant" element={<Navigate to="/frontdesk" replace />} />
          <Route path="/assistant/patients" element={<Navigate to="/frontdesk/patients" replace />} />
          <Route path="/assistant/dispensing" element={<Navigate to="/frontdesk/dispensing" replace />} />
          <Route path="/assistant/glasses-orders" element={<Navigate to="/frontdesk/glasses-orders" replace />} />
          <Route path="/assistant/glasses-prescription" element={<Navigate to="/frontdesk/prescriptions" replace />} />
          <Route path="/assistant/item-orders" element={<Navigate to="/frontdesk/item-orders" replace />} />
          <Route path="/assistant/outreach" element={<Navigate to="/frontdesk/outreach" replace />} />

          {/* Manager */}
          <Route path="/manager" element={<P roles={['manager']}><ManagerDashboard /></P>} />
          <Route path="/manager/patients" element={<P roles={['manager']}><PatientsPage /></P>} />
          <Route path="/manager/appointments" element={<P roles={['manager']}><AppointmentsPage /></P>} />
          <Route path="/manager/calendar" element={<P roles={['manager']}><CalendarPage /></P>} />
          <Route path="/manager/users" element={<P roles={['manager']}><UsersPage /></P>} />
          <Route path="/manager/reports" element={<P roles={['manager']}><ReportsPage /></P>} />
          <Route path="/manager/audit" element={<P roles={['manager']}><AuditPage /></P>} />

          {/* Admin */}
          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/patients" element={<P roles={['admin']}><PatientsPage /></P>} />
          <Route path="/admin/appointments" element={<P roles={['admin']}><AppointmentsPage /></P>} />
          <Route path="/admin/calendar" element={<P roles={['admin']}><CalendarPage /></P>} />
          <Route path="/admin/inventory" element={<P roles={['admin']}><InventoryPage /></P>} />
          <Route path="/admin/users" element={<P roles={['admin']}><UsersPage /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><ReportsPage /></P>} />
          <Route path="/admin/payments" element={<P roles={['admin']}><PaymentsPage /></P>} />
          <Route path="/admin/summary" element={<P roles={['admin']}><DailySummaryPage /></P>} />
          <Route path="/admin/subscriptions" element={<P roles={['admin']}><SubscriptionsPage /></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
