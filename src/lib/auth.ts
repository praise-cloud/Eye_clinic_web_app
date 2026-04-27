import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'

export const VALID_USER_ROLES: UserRole[] = ['doctor', 'frontdesk', 'admin', 'manager']

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  assistant: 'frontdesk',
  accountant: 'admin',
}

export function normalizeUserRole(role?: string | null): UserRole {
  if (!role) return 'frontdesk'

  const normalizedRole = LEGACY_ROLE_MAP[role] ?? role
  return VALID_USER_ROLES.includes(normalizedRole as UserRole)
    ? (normalizedRole as UserRole)
    : 'frontdesk'
}

export function getRoleDashboardPath(role?: string | null): string {
  return `/${normalizeUserRole(role)}`
}

export function buildFallbackProfile(user: User): Profile {
  const role = normalizeUserRole(user.user_metadata?.role)
  const timestamp = new Date().toISOString()

  return {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email || 'Clinic Staff',
    role,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  }
}
