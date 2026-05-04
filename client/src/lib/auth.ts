import type { Profile } from '@/types'

// Build fallback profile
export function buildFallbackProfile(email: string, name?: string): Partial<Profile> {
  return {
    email,
    full_name: name || email.split('@')[0],
    role: 'frontdesk',
    is_active: true
  }
}

// Normalize user role
export function normalizeUserRole(role: string): Profile['role'] {
  const normalized = role.toLowerCase()
  const validRoles = ['admin', 'manager', 'doctor', 'frontdesk']
  return validRoles.includes(normalized) ? normalized as Profile['role'] : 'frontdesk'
}

// Get role dashboard path
export function getRoleDashboardPath(user: Partial<Profile>): string {
  const rolePaths: Record<string, string> = {
    admin: '/admin',
    manager: '/manager',
    doctor: '/doctor',
    frontdesk: '/frontdesk'
  }
  return rolePaths[user.role || 'frontdesk']
}
