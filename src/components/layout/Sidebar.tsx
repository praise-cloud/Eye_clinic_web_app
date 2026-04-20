import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, FileText, Pill,
  Package, DollarSign, MessageSquare, Settings, LogOut,
  ClipboardList, UserCog, BarChart3, Send
} from 'lucide-react'
import { cn, getInitials, getRoleAccent } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navByRole: Record<UserRole, NavItem[]> = {
  doctor: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
    { label: 'Case Notes', href: '/doctor/case-notes', icon: FileText },
    { label: 'Prescriptions', href: '/doctor/prescriptions', icon: ClipboardList },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  assistant: [
    { label: 'Dashboard', href: '/assistant', icon: LayoutDashboard },
    { label: 'Patients', href: '/assistant/patients', icon: Users },
    { label: 'Appointments', href: '/assistant/appointments', icon: Calendar },
    { label: 'Drug Dispensing', href: '/assistant/dispensing', icon: Pill },
    { label: 'Glasses Orders', href: '/assistant/glasses-orders', icon: Package },
    { label: 'Outreach', href: '/assistant/outreach', icon: Send },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Patients', href: '/admin/patients', icon: Users },
    { label: 'Inventory', href: '/admin/inventory', icon: Package },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'User Management', href: '/admin/users', icon: UserCog },
    { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  accountant: [
    { label: 'Dashboard', href: '/accountant', icon: LayoutDashboard },
    { label: 'Payments', href: '/accountant/payments', icon: DollarSign },
    { label: 'Daily Summary', href: '/accountant/summary', icon: BarChart3 },
    { label: 'Subscriptions', href: '/accountant/subscriptions', icon: ClipboardList },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
}

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { profile } = useAuthStore()
  const role = profile?.role ?? 'assistant'
  const accent = getRoleAccent(role)
  const items = navByRole[role] ?? navByRole.assistant

  return (
    <aside className="flex flex-col w-60 h-screen bg-slate-900 text-slate-300 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Eye Clinic</p>
          <p className="text-xs capitalize" style={{ color: accent }}>{role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )
            }
            style={({ isActive }) => isActive ? { backgroundColor: `${accent}20`, color: accent, borderLeft: `3px solid ${accent}` } : {}}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: accent }}>
            {getInitials(profile?.full_name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
