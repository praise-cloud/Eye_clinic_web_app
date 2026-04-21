import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, LogOut, Settings, ChevronDown } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

function getBreadcrumb(pathname: string): string {
  const map: Record<string, string> = {
    '/doctor': 'Dashboard', '/assistant': 'Dashboard', '/admin': 'Dashboard', '/accountant': 'Dashboard',
    '/doctor/patients': 'Patients', '/assistant/patients': 'Patients', '/admin/patients': 'Patients',
    '/doctor/appointments': 'Appointments', '/assistant/appointments': 'Appointments',
    '/doctor/case-notes': 'Case Notes', '/doctor/prescriptions': 'Prescriptions',
    '/assistant/dispensing': 'Drug Dispensing', '/assistant/glasses-orders': 'Glasses Orders',
    '/assistant/outreach': 'Outreach', '/admin/inventory': 'Inventory',
    '/admin/users': 'Staff Management', '/admin/audit': 'Audit Logs', '/admin/reports': 'Reports',
    '/accountant/payments': 'Payments', '/accountant/summary': 'Daily Summary',
    '/accountant/subscriptions': 'Subscriptions', '/chat': 'Messages', '/settings': 'Settings',
  }
  return map[pathname] ?? pathname.split('/').filter(Boolean).map(s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')).join(' › ')
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { profile } = useAuthStore()
  const { logout } = useAuth()
  const { pathname } = useLocation()
  const accent = getRoleAccent(profile?.role ?? 'assistant')
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
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 flex-shrink-0" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">{pageTitle}</h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: accent }}>
              {getInitials(profile?.full_name ?? 'U')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[100px]">{profile?.full_name}</p>
              <span className={`text-[10px] capitalize font-medium ${getRoleColor(profile?.role ?? '')}`}>{profile?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
              </div>
              <div className="p-1">
                <Link to="/settings" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" />Settings
                </Link>
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
