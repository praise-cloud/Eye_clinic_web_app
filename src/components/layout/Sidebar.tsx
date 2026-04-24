import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, FileText, Pill,
  Package, DollarSign, MessageSquare, Settings, LogOut,
  ClipboardList, UserCog, BarChart3, Send, ChevronRight
} from 'lucide-react'
import { cn, getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface NavItem { label: string; href: string; icon: React.ElementType; badge?: number }

const navByRole: Record<UserRole, NavItem[]> = {
  doctor: [
    { label: 'Dashboard', href: '/doctor', icon: LayoutDashboard },
    { label: 'Patients', href: '/doctor/patients', icon: Users },
    { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
    { label: 'Case Notes', href: '/doctor/case-notes', icon: FileText },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  assistant: [
    { label: 'Dashboard', href: '/assistant', icon: LayoutDashboard },
    { label: 'Patients', href: '/assistant/patients', icon: Users },
    { label: 'Appointments', href: '/assistant/appointments', icon: Calendar },
    { label: 'Drug Dispensing', href: '/assistant/dispensing', icon: Pill },
    { label: 'Glasses Orders', href: '/assistant/glasses-orders', icon: Package },
    { label: 'Prescriptions', href: '/assistant/prescriptions', icon: ClipboardList },
    { label: 'Inventory', href: '/assistant/inventory', icon: Package },
    { label: 'Outreach', href: '/assistant/outreach', icon: Send },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Patients', href: '/admin/patients', icon: Users },
    { label: 'Inventory', href: '/assistant/inventory', icon: Package },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Staff', href: '/admin/users', icon: UserCog },
    { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
  accountant: [
    { label: 'Dashboard', href: '/accountant', icon: LayoutDashboard },
    { label: 'Payments', href: '/accountant/payments', icon: DollarSign },
    { label: 'Daily Summary', href: '/accountant/summary', icon: BarChart3 },
    { label: 'Subscriptions', href: '/accountant/subscriptions', icon: ClipboardList },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
    { label: 'Settings', href: '/settings', icon: Settings },
  ],
}

interface SidebarProps { onLogout: () => void }

export function Sidebar({ onLogout }: SidebarProps) {
  const { profile } = useAuthStore()
  const { logout } = useAuth()
  const role = profile?.role ?? 'assistant'
  const accent = getRoleAccent(role)
  const items = navByRole[role] ?? navByRole.assistant

  return (
    <aside className="flex flex-col w-64 h-screen bg-card border-r border-border flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
          style={{ backgroundColor: accent }}>
          <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">KORENE</p>
          <p className="text-xs text-muted-foreground mt-0.5">Eye Clinic</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-border">
        <span className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full ${getRoleColor(role)}`}>
          {role} Portal
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {items.map(item => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href.split('/').length <= 2}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            style={({ isActive }) => isActive ? { backgroundColor: accent } : {}}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-primary-foreground/60 flex-shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-accent transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
            style={{ backgroundColor: accent }}>
            {getInitials(profile?.full_name ?? 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <button onClick={onLogout} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
