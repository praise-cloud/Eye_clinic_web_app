import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { normalizeUserRole, getRoleDashboardPath, buildFallbackProfile } from '@/lib/auth'
import { TEST_USERS, TestUtils } from '../setup'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      admin: {
        deleteUser: vi.fn()
      }
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('Authentication Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role Normalization', () => {
    it('should normalize valid roles correctly', () => {
      expect(normalizeUserRole('doctor')).toBe('doctor')
      expect(normalizeUserRole('frontdesk')).toBe('frontdesk')
      expect(normalizeUserRole('admin')).toBe('admin')
      expect(normalizeUserRole('manager')).toBe('manager')
    })

    it('should normalize legacy roles', () => {
      expect(normalizeUserRole('assistant')).toBe('frontdesk')
      expect(normalizeUserRole('accountant')).toBe('admin')
      expect(normalizeUserRole('user')).toBe('manager')
    })

    it('should return default role for invalid/undefined roles', () => {
      expect(normalizeUserRole('')).toBe('frontdesk')
      expect(normalizeUserRole(null)).toBe('frontdesk')
      expect(normalizeUserRole(undefined)).toBe('frontdesk')
      expect(normalizeUserRole('invalid')).toBe('frontdesk')
    })
  })

  describe('Dashboard Path Generation', () => {
    it('should generate correct dashboard paths for each role', () => {
      expect(getRoleDashboardPath('doctor')).toBe('/doctor')
      expect(getRoleDashboardPath('frontdesk')).toBe('/frontdesk')
      expect(getRoleDashboardPath('admin')).toBe('/admin')
      expect(getRoleDashboardPath('manager')).toBe('/manager')
    })

    it('should handle invalid roles gracefully', () => {
      expect(getRoleDashboardPath('invalid')).toBe('/frontdesk')
      expect(getRoleDashboardPath('')).toBe('/frontdesk')
      expect(getRoleDashboardPath(null)).toBe('/frontdesk')
      expect(getRoleDashboardPath(undefined)).toBe('/frontdesk')
    })
  })

  describe('Fallback Profile Building', () => {
    it('should build fallback profile from user metadata', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          role: 'doctor'
        }
      }

      const profile = buildFallbackProfile(mockUser)

      expect(profile.id).toBe('test-user-id')
      expect(profile.full_name).toBe('Test User')
      expect(profile.role).toBe('doctor')
      expect(profile.is_active).toBe(true)
      expect(profile.created_at).toBeDefined()
      expect(profile.updated_at).toBeDefined()
    })

    it('should use email as fallback name when metadata is missing', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {}
      }

      const profile = buildFallbackProfile(mockUser)

      expect(profile.full_name).toBe('test')
      expect(profile.role).toBe('frontdesk')
    })

    it('should handle missing user metadata', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: undefined
      }

      const profile = buildFallbackProfile(mockUser)

      expect(profile.full_name).toBe('test')
      expect(profile.role).toBe('frontdesk')
    })
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'test-id' }, session: { access_token: 'test-token' } },
        error: null
      })

      const result = await TestUtils.createTestUser(TEST_USERS.doctor)

      expect(mockSignUp).toHaveBeenCalledWith({
        email: TEST_USERS.doctor.email,
        password: TEST_USERS.doctor.password,
        options: {
          data: {
            full_name: TEST_USERS.doctor.full_name,
            role: TEST_USERS.doctor.role,
          },
        },
      })

      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should handle registration errors', async () => {
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      })

      const result = await TestUtils.createTestUser(TEST_USERS.doctor)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValue({
        data: { 
          user: { id: 'test-id', email: TEST_USERS.doctor.email },
          session: { access_token: 'test-token' }
        },
        error: null
      })

      const result = await supabase.auth.signInWithPassword({
        email: TEST_USERS.doctor.email,
        password: TEST_USERS.doctor.password
      })

      expect(mockSignIn).toHaveBeenCalledWith({
        email: TEST_USERS.doctor.email,
        password: TEST_USERS.doctor.password
      })

      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should handle login errors', async () => {
      const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
      mockSignIn.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      const result = await supabase.auth.signInWithPassword({
        email: TEST_USERS.doctor.email,
        password: 'wrong-password'
      })

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      const mockSignOut = vi.mocked(supabase.auth.signOut)
      mockSignOut.mockResolvedValue({ error: null })

      const result = await supabase.auth.signOut()

      expect(mockSignOut).toHaveBeenCalled()
      expect(result.error).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockGetSession = vi.mocked(supabase.auth.getSession)
      mockGetSession.mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-id', email: TEST_USERS.doctor.email },
            access_token: 'test-token'
          }
        },
        error: null
      })

      const result = await supabase.auth.getSession()

      expect(mockGetSession).toHaveBeenCalled()
      expect(result.data).toBeDefined()
      expect(result.data?.session).toBeDefined()
    })

    it('should handle no active session', async () => {
      const mockGetSession = vi.mocked(supabase.auth.getSession)
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await supabase.auth.getSession()

      expect(result.data?.session).toBeNull()
    })
  })

  describe('User Deletion', () => {
    it('should delete user successfully', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-user-id' },
            error: null
          }))
        }))
      }))
      const mockAdminDelete = vi.mocked(supabase.auth.admin.deleteUser)
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)
      mockAdminDelete.mockResolvedValue({ error: null })

      await TestUtils.deleteTestUser(TEST_USERS.doctor.email)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockAdminDelete).toHaveBeenCalledWith('test-user-id')
    })

    it('should handle user not found during deletion', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'User not found' }
          }))
        }))
      }))
      const mockAdminDelete = vi.mocked(supabase.auth.admin.deleteUser)
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      await TestUtils.deleteTestUser('nonexistent@test.com')

      expect(mockAdminDelete).not.toHaveBeenCalled()
    })
  })
})
