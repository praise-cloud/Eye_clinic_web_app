import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

interface AppShellProps {
    children: React.ReactNode
}

function getPageTitle(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] ?? 'dashboard'
    return last
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

export function AppShell({ children }: AppShellProps) {
    const { logout } = useAuth()
    const { pathname } = useLocation()
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex">
                <Sidebar onLogout={logout} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full">
                        <Sidebar onLogout={logout} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header
                    title={getPageTitle(pathname)}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                    {children}
                </main>
            </div>
        </div>
    )
}
