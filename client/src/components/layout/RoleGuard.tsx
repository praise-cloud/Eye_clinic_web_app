import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'
import type { Profile } from '../../types'
import { getRoleDashboardPath } from '../../lib/auth'

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: Profile['role'][]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { isAuthenticated, isLoading, user } = useAuthStore()
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Check if user has required role
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to={getRoleDashboardPath(user)} replace />
    }

    // If not authenticated, will be redirected by useEffect above
    if (!isAuthenticated || !user) {
        return null
    }

    return <>{children}</>
}
