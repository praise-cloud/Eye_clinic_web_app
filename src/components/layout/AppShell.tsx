import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { ToastContainer } from './ToastContainer'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

interface AppShellProps { children: React.ReactNode }

export function AppShell({ children }: AppShellProps) {
    const { logout } = useAuth()
    const { pathname } = useLocation()
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    const title = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex flex-shrink-0">
                <Sidebar onLogout={logout} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full shadow-2xl">
                        <Sidebar onLogout={logout} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header title={title} onMenuClick={() => setMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 scrollbar-thin">
                    {children}
                </main>
                <ToastContainer />
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav onLogout={logout} />
        </div>
    )
}
