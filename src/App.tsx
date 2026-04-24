import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { RoleGuard } from './components/layout/RoleGuard'
import { AppShell } from './components/layout/AppShell'
import type { Profile } from './types'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications'

// Pages
import { SplashScreen } from './pages/SplashScreen'
import { LoginPage } from './pages/auth/LoginPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { FrontdeskDashboard } from './pages/frontdesk/FrontdeskDashboard'
import { ManagerDashboard } from './pages/manager/ManagerDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { PatientsPage } from './pages/patients/PatientsPage'
import { PatientDetailPage } from './pages/patients/PatientDetailPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { CaseNotesPage } from './pages/doctor/CaseNotesPage'
import { DispensingPage } from './pages/frontdesk/DispensingPage'
import { GlassesOrdersPage } from './pages/frontdesk/GlassesOrdersPage'
import { GlassesPrescriptionPage } from './pages/frontdesk/GlassesPrescriptionPage'
import { InventoryPage } from './pages/admin/InventoryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { AuditPage } from './pages/manager/AuditPage'
import { PaymentsPage } from './pages/admin/PaymentsPage'
import { DailySummaryPage } from './pages/admin/DailySummaryPage'
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ChatPage } from './pages/chat/ChatPage'
import { OutreachPage } from './pages/frontdesk/OutreachPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

function AuthProvider() {
  const { setUser, setProfile, setLoading, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (data) {
            setProfile(data as Profile)
          } else {
            const meta = session.user.user_metadata
            const role = (meta?.role ?? 'frontdesk') as Profile['role']
            const full_name = meta?.full_name ?? session.user.email?.split('@')[0] ?? 'User'
            const { data: newProfile } = await supabase.from('profiles').upsert({
              id: session.user.id, full_name, role, is_active: true,
            }, { onConflict: 'id' }).select().single()
            if (newProfile) setProfile(newProfile as Profile)
          }
        }
      } catch (e) {
        console.warn('Session check failed:', e)
      } finally {
        setLoading(false)
        setInitialCheckDone(true)
      }
    }

    const timeout = setTimeout(() => {
      setLoading(false)
      setInitialCheckDone(true)
    }, 10000)

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (data) {
            setProfile(data as Profile)
            setLoading(false)
            navigate(`/${data.role}`, { replace: true })
          } else {
            const meta = session.user.user_metadata
            const role = (meta?.role ?? 'frontdesk') as Profile['role']
            const full_name = meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? 'User'
            const phone = meta?.phone ?? undefined
            const { data: newProfile } = await supabase.from('profiles').upsert({
              id: session.user.id, full_name, role, is_active: true, phone,
            }, { onConflict: 'id' }).select().single()
            setProfile((newProfile ?? { id: session.user.id, full_name, role, is_active: true, created_at: '', updated_at: '' }) as Profile)
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
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

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
  const { setTheme } = useUIStore()

  useEffect(() => {
    const savedTheme = localStorage.getItem('ui-storage')
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        if (parsed.state?.theme) {
          document.documentElement.classList.toggle('dark', parsed.state.theme === 'dark')
        }
      } catch (e) {}
    }
  }, [])

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

          {/* Doctor — patients, appointments, case notes */}
          <Route path="/doctor" element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/patients" element={<P roles={['doctor']}><PatientsPage /></P>} />
          <Route path="/doctor/appointments" element={<P roles={['doctor']}><AppointmentsPage /></P>} />
          <Route path="/doctor/case-notes" element={<P roles={['doctor']}><CaseNotesPage /></P>} />

          {/* Frontdesk — patients, appointments, dispensing, glasses, outreach */}
          <Route path="/frontdesk" element={<P roles={['frontdesk']}><FrontdeskDashboard /></P>} />
          <Route path="/frontdesk/patients" element={<P roles={['frontdesk']}><PatientsPage /></P>} />
          <Route path="/frontdesk/appointments" element={<P roles={['frontdesk']}><AppointmentsPage /></P>} />
          <Route path="/frontdesk/dispensing" element={<P roles={['frontdesk']}><DispensingPage /></P>} />
          <Route path="/frontdesk/glasses-orders" element={<P roles={['frontdesk']}><GlassesOrdersPage /></P>} />
          <Route path="/frontdesk/outreach" element={<P roles={['frontdesk']}><OutreachPage /></P>} />
          <Route path="/frontdesk/prescriptions" element={<P roles={['frontdesk']}><GlassesPrescriptionPage /></P>} />

          {/* Admin/Accounts — combined admin + accountant (NO audit logs) */}
          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/patients" element={<P roles={['admin']}><PatientsPage /></P>} />
          <Route path="/admin/inventory" element={<P roles={['admin']}><InventoryPage /></P>} />
          <Route path="/admin/users" element={<P roles={['admin']}><UsersPage /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><ReportsPage /></P>} />
          <Route path="/admin/payments" element={<P roles={['admin']}><PaymentsPage /></P>} />
          <Route path="/admin/summary" element={<P roles={['admin']}><DailySummaryPage /></P>} />
          <Route path="/admin/subscriptions" element={<P roles={['admin']}><SubscriptionsPage /></P>} />

          {/* Manager — audit logs, reports, create accounts */}
          <Route path="/manager" element={<P roles={['manager']}><ManagerDashboard /></P>} />
          <Route path="/manager/audit" element={<P roles={['manager']}><AuditPage /></P>} />
          <Route path="/manager/reports" element={<P roles={['manager']}><ReportsPage /></P>} />
          <Route path="/manager/users" element={<P roles={['manager']}><UsersPage /></P>} />

          {/* Shared chat */}
          <Route path="/chat" element={<P><ChatPage /></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
