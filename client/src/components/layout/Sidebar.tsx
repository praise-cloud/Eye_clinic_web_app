import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  Pill,
  Calendar,
  MessageSquare,
  Bell,
  LogOut,
  ChevronLeft,
  DollarSign,
  ClipboardList
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../types'

interface SidebarProps {
  onLogout: () => void
}

const adminItems = [
  { id: 'dashboard', name: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'patients', name: 'Patients', icon: Users, path: '/patients' },
  { id: 'appointments', name: 'Appointments', icon: Calendar, path: '/appointments' },
  { id: 'doctor-case-studies', name: 'Doctor Case Studies', icon: ClipboardList, path: '/case-studies' },
  { id: 'revenue', name: 'Financial Oversight', icon: DollarSign, path: '/revenue' },
  { id: 'inventory', name: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'pharmacy', name: 'Pharmacy', icon: Pill, path: '/pharmacy' },
  { id: 'settings', name: 'System Settings', icon: Settings, path: '/settings' },
]

const doctorItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'patients', name: 'Patients', icon: Users, path: '/patients' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'case-notes', name: 'Case Notes', icon: FileText, path: '/case-notes' },
  { id: 'prescriptions', name: 'Prescriptions', icon: Pill, path: '/prescriptions' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
]

const assistantItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'messages', name: 'Messages', icon: MessageSquare, path: '/messages' },
  { id: 'patients', name: 'Patients', icon: Users, path: '/patients' },
  { id: 'calendar', name: 'Appointments', icon: Calendar, path: '/calendar' },
  { id: 'pharmacy', name: 'Pharmacy', icon: Pill, path: '/pharmacy' },
  { id: 'prescriptions', name: 'Prescriptions', icon: ClipboardList, path: '/prescriptions' },
  { id: 'inventory', name: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
]

const accountantItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'revenue', name: 'Revenue', icon: DollarSign, path: '/revenue' },
  { id: 'patients', name: 'Patients', icon: Users, path: '/patients' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
]

export function Sidebar({ onLogout }: SidebarProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getSidebarItems = (role: UserRole | undefined) => {
    switch (role) {
      case 'admin': return adminItems
      case 'doctor': return doctorItems
      case 'assistant': return assistantItems
      case 'accountant': return accountantItems
      default: return assistantItems
    }
  }

  const sidebarItems = getSidebarItems(user?.role)

  return (
    <div className={`flex flex-col bg-surface-900 h-screen transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-surface-800">
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Eye Clinic</span>
            <span className="text-xs text-primary-400 uppercase tracking-wider">Management</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path))
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white' 
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-surface-800">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-white transition-all ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  )
}