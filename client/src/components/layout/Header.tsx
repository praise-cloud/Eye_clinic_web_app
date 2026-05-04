import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut, Settings, ChevronDown, Sun, Moon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useAuth } from '../../hooks/useAuth'
import { getInitials, getRoleAccent, getRoleColor } from '../../lib/utils'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

function getBreadcrumb(pathname: string): string {
  const map: Record<string, string> = {
'/doctor': 'Dashboard', '/frontdesk': 'Dashboard', '/admin': 'Dashboard', '/manager': 'Dashboard',

    '/doctor/patients': 'Patients', '/frontdesk/patients': 'Patients', '/admin/patients': 'Patients',

    '/doctor/appointments': 'Appointments', '/frontdesk/appointments': 'Appointments',

    '/frontdesk/dispensing': 'Drug Dispensing', '/frontdesk/glasses-orders': 'Glasses Orders',

    '/frontdesk/outreach': 'Outreach', '/admin/inventory': 'Inventory',
    '/admin/audit': 'Audit Logs', '/admin/reports': 'Reports',
    '/admin/payments': 'Payments', '/admin/summary': 'Daily Summary',
    '/admin/subscriptions': 'Subscriptions', '/manager/audit': 'Audit Logs',
  }
  return map[pathname] ?? pathname.split('/').filter(Boolean).map(s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')).join(' › ')
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { profile } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const accent = getRoleAccent(profile?.role ?? 'frontdesk')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pageTitle = getBreadcrumb(pathname)

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground flex-shrink-0" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">{pageTitle}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors" aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-accent transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
              style={{ backgroundColor: accent }}>
              {getInitials(profile?.full_name ?? 'U')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-none truncate max-w-[100px]">{profile?.full_name}</p>
              <span className={`text-[10px] capitalize font-medium ${getRoleColor(profile?.role ?? '')}`}>{profile?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <div className="p-1">
                <Link to="/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-xl transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />Settings
                </Link>
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" />Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
