import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

// Helper to map invalid roles to valid ones
const mapRole = (role: string | undefined): string => {
  const validRoles: UserRole[] = ['doctor', 'frontdesk', 'admin', 'manager']
  if (!role) return 'frontdesk'
  return validRoles.includes(role as UserRole) ? role : 'frontdesk'
}

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { isAuthenticated, isLoading, profile } = useAuthStore()

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

    const role = mapRole(profile?.role)
    if (allowedRoles && !allowedRoles.includes(role as UserRole)) {
        return <Navigate to={`/${role}`} replace />
    }

    return <>{children}</>
}
