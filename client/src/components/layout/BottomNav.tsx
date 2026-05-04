import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, Pill, Package, DollarSign, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getRoleAccent } from '../../lib/utils'
import type { UserRole } from '../../types'

const bottomNavByRole: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
    doctor: [
        { label: 'Home', href: '/doctor', icon: LayoutDashboard },
        { label: 'Patients', href: '/doctor/patients', icon: Users },
        { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
    frontdesk: [
        { label: 'Home', href: '/frontdesk', icon: LayoutDashboard },
        { label: 'Patients', href: '/frontdesk/patients', icon: Users },
        { label: 'Dispense', href: '/frontdesk/dispensing', icon: Pill },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
    admin: [
        { label: 'Home', href: '/admin', icon: LayoutDashboard },
        { label: 'Patients', href: '/admin/patients', icon: Users },
        { label: 'Inventory', href: '/admin/inventory', icon: Package },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
    ],


    manager: [
        { label: 'Home', href: '/manager', icon: LayoutDashboard },
        { label: 'Audit', href: '/manager/audit', icon: BarChart3 },
        { label: 'Staff', href: '/manager/users', icon: Users },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
}

interface BottomNavProps {
    onLogout: () => void
}

export function BottomNav({ onLogout }: BottomNavProps) {
    const { profile } = useAuthStore()
    const role = profile?.role ?? 'frontdesk'
    const accent = getRoleAccent(role)
    const items = bottomNavByRole[role] ?? bottomNavByRole.frontdesk

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around px-1 py-1 safe-area-pb shadow-lg">
            {items.map((item) => (
                <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href.split('/').length <= 2}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-0 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`
                    }
                    style={({ isActive }) => isActive ? { color: accent } : {}}
                >
                    {({ isActive }) => (
                        <>
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                            <span className="text-[10px] font-medium truncate">{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}
