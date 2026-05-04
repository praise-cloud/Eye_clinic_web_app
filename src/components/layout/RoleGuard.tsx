import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import type { UserRole } from '@/types'
import { getRoleDashboardPath, normalizeUserRole } from '@/lib/auth'

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { isAuthenticated, isLoading, profile } = useAuthStore()
    const navigate = useNavigate()

    // Safety check: redirect to login if not authenticated (handles browser back button)
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true })
        }
    }, [isAuthenticated, isLoading, navigate])

    // Show nothing while auth is resolving
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />

    const role = normalizeUserRole(profile?.role)
    if (allowedRoles && !allowedRoles.includes(role as UserRole)) {
        return <Navigate to={getRoleDashboardPath(role)} replace />
    }

    return <>{children}</>
}
