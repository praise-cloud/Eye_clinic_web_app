import { describe, expect, it } from 'vitest'
import { buildFallbackProfile, getRoleDashboardPath, normalizeUserRole } from './auth'

describe('auth helpers', () => {
  it('normalizes supported roles', () => {
    expect(normalizeUserRole('doctor')).toBe('doctor')
    expect(normalizeUserRole('frontdesk')).toBe('frontdesk')
    expect(normalizeUserRole('admin')).toBe('admin')
    expect(normalizeUserRole('manager')).toBe('manager')
  })

  it('maps legacy roles to supported roles', () => {
    expect(normalizeUserRole('assistant')).toBe('frontdesk')
    expect(normalizeUserRole('accountant')).toBe('admin')
  })

  it('falls back to frontdesk for unknown roles', () => {
    expect(normalizeUserRole('unknown')).toBe('frontdesk')
    expect(normalizeUserRole()).toBe('frontdesk')
  })

  it('builds dashboard paths from roles', () => {
    expect(getRoleDashboardPath('doctor')).toBe('/doctor')
    expect(getRoleDashboardPath('assistant')).toBe('/frontdesk')
  })

  it('builds a fallback profile from auth metadata', () => {
    const profile = buildFallbackProfile({
      id: 'user-1',
      email: 'doctor@clinic.test',
      user_metadata: {
        full_name: 'Dr. Test User',
        role: 'doctor',
      },
    } as any)

    expect(profile.id).toBe('user-1')
    expect(profile.full_name).toBe('Dr. Test User')
    expect(profile.role).toBe('doctor')
    expect(profile.is_active).toBe(true)
  })
})
