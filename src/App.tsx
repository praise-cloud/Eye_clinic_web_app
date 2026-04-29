import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { RoleGuard } from './components/layout/RoleGuard'
import { AppShell } from './components/layout/AppShell'
import type { Profile } from './types'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications'
import { useClinicStore } from './hooks/useClinicSettings'
import { buildFallbackProfile } from './lib/auth'

// Pages
import { SplashScreen } from './pages/SplashScreen'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { FrontdeskDashboard } from './pages/frontdesk/FrontdeskDashboard'
import { ManagerDashboard } from './pages/manager/ManagerDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { PatientsPage } from './pages/patients/PatientsPage'
import { PatientDetailPage } from './pages/patients/PatientDetailPage'
import { AppointmentsPage } from './pages/appointments/AppointmentsPage'
import { CalendarPage } from './pages/appointments/CalendarPage'
import { CaseNotesPage } from './pages/doctor/CaseNotesPage'
import { DispensingPage } from './pages/frontdesk/DispensingPage'
import { GlassesOrdersPage } from './pages/frontdesk/GlassesOrdersPage'
import { GlassesPrescriptionPage } from './pages/frontdesk/GlassesPrescriptionPage'
import { InventoryPage } from './pages/admin/InventoryPage'
import { UsersPage } from './pages/admin/UsersPage'
import { ReportsPage } from './pages/admin/ReportsPage'
import { TransactionHistoryPage } from './pages/manager/TransactionHistoryPage'
import { MessagesPage } from './pages/manager/MessagesPage'
import { ManagerSettings } from './pages/manager/ManagerSettings'
import { PaymentsPage } from './pages/admin/PaymentsPage'
import { DailySummaryPage } from './pages/admin/DailySummaryPage'
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage'
import { AuditPage } from './pages/admin/AuditPage'
import { NotificationsPage } from './pages/notifications/NotificationsPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { ChatPage } from './pages/chat/ChatPage'
import { OutreachPage } from './pages/frontdesk/OutreachPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const withTimeout = (promise: Promise<any>, ms: number) => 
      Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
      ])

    const init = async () => {
      const failSafeTimer = setTimeout(() => {
        if (mounted) {
          setLoading(false)
          setInitialCheckDone(true)
        }
      }, 2000)

      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 3000) as any

        if (mounted && session?.user) {
          setUser(session.user)
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            setProfile(data ? (data as Profile) : buildFallbackProfile(session.user))
          } catch (e) {
            setProfile(buildFallbackProfile(session.user))
          }
        }
      } catch (e) {
        // Timeout or error, proceed to login
      }

      clearTimeout(failSafeTimer)
      if (mounted) {
        setLoading(false)
        setInitialCheckDone(true)
      }
    }

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] onAuthStateChange:', event, session?.user?.id)
      if (session?.user) {
        setUser(session.user)
        void (async () => {
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            const profile = data ? (data as Profile) : buildFallbackProfile(session.user)
            console.log('[AuthProvider] Profile loaded:', profile.role)
            setProfile(profile)
          } catch {
            setProfile(buildFallbackProfile(session.user))
          }
        })()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
      if (event !== 'TOKEN_REFRESHED') {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!initialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src="/icons/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return <>{children}</>
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
  const fetchSettings = useClinicStore(s => s.fetchSettings)
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated])

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
        <AuthProvider>
          <RealtimeProvider />
          <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Shared protected */}
          <Route path="/patients" element={<P><PatientsPage /></P>} />
          <Route path="/patients/:id" element={<P><PatientDetailPage /></P>} />
          <Route path="/settings" element={<P><SettingsPage /></P>} />

          {/* Doctor — patients, appointments, case notes */}
          <Route path="/doctor" element={<P roles={['doctor']}><DoctorDashboard /></P>} />
          <Route path="/doctor/patients" element={<P roles={['doctor']}><PatientsPage /></P>} />
          <Route path="/doctor/appointments" element={<P roles={['doctor']}><AppointmentsPage /></P>} />
          <Route path="/doctor/calendar" element={<P roles={['doctor']}><CalendarPage /></P>} />
          <Route path="/doctor/case-notes" element={<P roles={['doctor']}><CaseNotesPage /></P>} />

          {/* Frontdesk — patients, appointments, calendar, dispensing, glasses, outreach */}
          <Route path="/frontdesk" element={<P roles={['frontdesk']}><FrontdeskDashboard /></P>} />
          <Route path="/frontdesk/patients" element={<P roles={['frontdesk']}><PatientsPage /></P>} />
          <Route path="/frontdesk/appointments" element={<P roles={['frontdesk']}><AppointmentsPage /></P>} />
          <Route path="/frontdesk/calendar" element={<P roles={['frontdesk']}><CalendarPage /></P>} />
          <Route path="/frontdesk/dispensing" element={<P roles={['frontdesk']}><DispensingPage /></P>} />
          <Route path="/frontdesk/glasses-orders" element={<P roles={['frontdesk']}><GlassesOrdersPage /></P>} />
          <Route path="/frontdesk/outreach" element={<P roles={['frontdesk']}><OutreachPage /></P>} />
          <Route path="/frontdesk/prescriptions" element={<P roles={['frontdesk']}><GlassesPrescriptionPage /></P>} />

          {/* Admin/Accounts — combined admin + accountant */}
          <Route path="/admin" element={<P roles={['admin']}><AdminDashboard /></P>} />
          <Route path="/admin/patients" element={<P roles={['admin']}><PatientsPage /></P>} />
          <Route path="/admin/calendar" element={<P roles={['admin']}><CalendarPage /></P>} />
          <Route path="/admin/inventory" element={<P roles={['admin']}><InventoryPage /></P>} />
          <Route path="/admin/users" element={<P roles={['admin']}><UsersPage /></P>} />
          <Route path="/admin/appointments" element={<P roles={['admin']}><AppointmentsPage /></P>} />
          <Route path="/admin/calendar" element={<P roles={['admin']}><CalendarPage /></P>} />
          <Route path="/admin/reports" element={<P roles={['admin']}><ReportsPage /></P>} />
          <Route path="/admin/payments" element={<P roles={['admin']}><PaymentsPage /></P>} />
          <Route path="/admin/summary" element={<P roles={['admin']}><DailySummaryPage /></P>} />
          <Route path="/admin/subscriptions" element={<P roles={['admin']}><SubscriptionsPage /></P>} />
          <Route path="/admin/audit" element={<P roles={['admin']}><AuditPage /></P>} />

          {/* Manager — dashboard, appointments, transactions, messages, settings */}
          <Route path="/manager" element={<P roles={['manager']}><ManagerDashboard /></P>} />
          <Route path="/manager/appointments" element={<P roles={['manager']}><AppointmentsPage /></P>} />
          <Route path="/manager/calendar" element={<P roles={['manager']}><CalendarPage /></P>} />
          <Route path="/appointments" element={<P roles={['manager']}><AppointmentsPage /></P>} />
          <Route path="/manager/transactions" element={<P roles={['manager']}><TransactionHistoryPage /></P>} />
          <Route path="/manager/messages" element={<P roles={['manager']}><MessagesPage /></P>} />
          <Route path="/manager/settings" element={<P roles={['manager']}><ManagerSettings /></P>} />

          {/* Shared chat */}
          <Route path="/chat" element={<P><ChatPage /></P>} />

          {/* Notifications - all authenticated users */}
          <Route path="/notifications" element={<P><NotificationsPage /></P>} />

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
