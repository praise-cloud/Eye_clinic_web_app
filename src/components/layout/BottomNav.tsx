import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getRoleAccent } from '@/lib/utils'
import type { UserRole } from '@/types'

const bottomNavByRole: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
    doctor: [
        { label: 'Home', href: '/doctor', icon: LayoutDashboard },
        { label: 'Patients', href: '/doctor/patients', icon: Users },
        { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
    assistant: [
        { label: 'Home', href: '/assistant', icon: LayoutDashboard },
        { label: 'Patients', href: '/assistant/patients', icon: Users },
        { label: 'Appointments', href: '/assistant/appointments', icon: Calendar },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
    admin: [
        { label: 'Home', href: '/admin', icon: LayoutDashboard },
        { label: 'Patients', href: '/admin/patients', icon: Users },
        { label: 'Inventory', href: '/admin/inventory', icon: Calendar },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
    accountant: [
        { label: 'Home', href: '/accountant', icon: LayoutDashboard },
        { label: 'Payments', href: '/accountant/payments', icon: Users },
        { label: 'Summary', href: '/accountant/summary', icon: Calendar },
        { label: 'Chat', href: '/chat', icon: MessageSquare },
        { label: 'Settings', href: '/settings', icon: Settings },
    ],
}

interface BottomNavProps {
    onLogout: () => void
}

export function BottomNav({ onLogout }: BottomNavProps) {
    const { profile } = useAuthStore()
    const role = profile?.role ?? 'assistant'
    const accent = getRoleAccent(role)
    const items = bottomNavByRole[role] ?? bottomNavByRole.assistant

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border flex items-center justify-around px-2 py-1 safe-area-pb">
            {items.map((item) => (
                <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href.split('/').length <= 2}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                        }`
                    }
                    style={({ isActive }) => isActive ? { color: accent } : {}}
                >
                    {({ isActive }) => (
                        <>
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-[10px] font-medium truncate">{item.label}</span>
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    )
}
