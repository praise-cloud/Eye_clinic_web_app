import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserRole } from '@/types'

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { isAuthenticated, isLoading, profile } = useAuthStore()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="space-y-3 w-64">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to their correct dashboard
        return <Navigate to={`/${profile.role}`} replace />
    }

    return <>{children}</>
}
