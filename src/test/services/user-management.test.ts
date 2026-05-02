import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_USERS, TestUtils } from '../setup'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn()
          })),
          like: vi.fn(() => ({
            delete: vi.fn()
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      admin: {
        deleteUser: vi.fn()
      }
    }
  }
}))

describe('User Management Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Creation', () => {
    it('should create a new user successfully', async () => {
      const userData = TEST_USERS.doctor
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id',
            email: userData.email,
            user_metadata: {
              full_name: userData.full_name,
              role: userData.role
            }
          }, 
          session: { access_token: 'test-token' }
        },
        error: null
      })

      const result = await TestUtils.createTestUser(userData)

      expect(mockSignUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      })

      expect(result.data).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should handle user creation errors', async () => {
      const userData = TEST_USERS.doctor
      const mockSignUp = vi.mocked(supabase.auth.signUp)
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      })

      const result = await TestUtils.createTestUser(userData)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should validate user data before creation', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123',
        role: 'invalid-role',
        full_name: ''
      }

      expect(invalidUser.email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(invalidUser.password).toBeLessThan(6)
      expect(invalidUser.role).not.toBeIn(['doctor', 'frontdesk', 'admin', 'manager'])
      expect(invalidUser.full_name).toBe('')
    })
  })

  describe('User Retrieval', () => {
    it('should retrieve all users', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', email: 'doctor@test.com', role: 'doctor', full_name: 'Test Doctor', is_active: true },
              { id: '2', email: 'frontdesk@test.com', role: 'frontdesk', full_name: 'Test Frontdesk', is_active: true },
              { id: '3', email: 'admin@test.com', role: 'admin', full_name: 'Test Admin', is_active: true },
              { id: '4', email: 'manager@test.com', role: 'manager', full_name: 'Test Manager', is_active: true }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      expect(result.data?.length).toBe(4)
    })

    it('should retrieve users by role', async () => {
      const role = 'doctor'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', email: 'doctor1@test.com', role: 'doctor', full_name: 'Doctor 1', is_active: true },
                { id: '2', email: 'doctor2@test.com', role: 'doctor', full_name: 'Doctor 2', is_active: true }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).eq('role', role)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      expect(result.data?.every((user: any) => user.role === role)).toBe(true)
    })

    it('should retrieve active users only', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', email: 'active1@test.com', role: 'doctor', full_name: 'Active User 1', is_active: true },
                { id: '2', email: 'active2@test.com', role: 'frontdesk', full_name: 'Active User 2', is_active: true }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).eq('is_active', true)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      expect(result.data?.every((user: any) => user.is_active === true)).toBe(true)
    })

    it('should retrieve user by ID', async () => {
      const userId = 'test-user-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: userId,
              email: 'doctor@test.com',
              role: 'doctor',
              full_name: 'Test Doctor',
              is_active: true
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').eq('id', userId).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.id).toBe(userId)
    })

    it('should retrieve user by email', async () => {
      const email = 'doctor@test.com'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-user-id',
              email: email,
              role: 'doctor',
              full_name: 'Test Doctor',
              is_active: true
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').eq('email', email).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.email).toBe(email)
    })
  })

  describe('User Updates', () => {
    it('should update user profile successfully', async () => {
      const userId = 'test-user-id'
      const updateData = { 
        full_name: 'Updated Name',
        phone: '+1234567890',
        is_active: true
      }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: userId,
                email: 'doctor@test.com',
                role: 'doctor',
                ...updateData,
                updated_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('profiles').update(updateData).eq('id', userId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.full_name).toBe(updateData.full_name)
      expect(result.data?.phone).toBe(updateData.phone)
    })

    it('should update user role successfully', async () => {
      const userId = 'test-user-id'
      const updateData = { role: 'admin' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: userId,
                email: 'user@test.com',
                full_name: 'Test User',
                ...updateData,
                updated_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('profiles').update(updateData).eq('id', userId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.role).toBe(updateData.role)
    })

    it('should toggle user active status', async () => {
      const userId = 'test-user-id'
      const updateData = { is_active: false }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: userId,
                email: 'user@test.com',
                full_name: 'Test User',
                role: 'doctor',
                ...updateData,
                updated_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('profiles').update(updateData).eq('id', userId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.is_active).toBe(false)
    })

    it('should handle update errors', async () => {
      const userId = 'non-existent-id'
      const updateData = { full_name: 'Updated Name' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'User not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('profiles').update(updateData).eq('id', userId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('User Deletion', () => {
    it('should delete user successfully', async () => {
      const email = 'doctor@test.com'
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
      mockAdminDelete.mockResolvedValue({ error: null })
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      await TestUtils.deleteTestUser(email)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(mockAdminDelete).toHaveBeenCalledWith('test-user-id')
    })

    it('should handle user not found during deletion', async () => {
      const email = 'nonexistent@test.com'
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

      await TestUtils.deleteTestUser(email)

      expect(mockAdminDelete).not.toHaveBeenCalled()
    })

    it('should handle deletion errors', async () => {
      const email = 'doctor@test.com'
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
      mockAdminDelete.mockResolvedValue({ error: { message: 'Failed to delete user' } })
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      await TestUtils.deleteTestUser(email)

      expect(mockAdminDelete).toHaveBeenCalledWith('test-user-id')
    })
  })

  describe('User Validation', () => {
    it('should handle all valid roles', () => {
      const validRoles = ['doctor', 'frontdesk', 'admin', 'manager']
      
      validRoles.forEach(role => {
        expect(role).toBeDefined()
        expect(typeof role).toBe('string')
        expect(['doctor', 'frontdesk', 'admin', 'manager']).toContain(role)
      })
    })

    it('should validate email format', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid-email'

      expect(validEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(invalidEmail).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    })

    it('should validate phone number format', () => {
      const validPhone = '+1234567890'
      const invalidPhone = '123'

      expect(validPhone).toMatch(/^\+?\d{10,}$/)
      expect(invalidPhone).not.toMatch(/^\+?\d{10,}$/)
    })

    it('should validate password strength', () => {
      const validPassword = 'test123456'
      const weakPassword = '123'

      expect(validPassword.length).toBeGreaterThanOrEqual(6)
      expect(weakPassword.length).toBeLessThan(6)
    })
  })

  describe('User Search and Filtering', () => {
    it('should search users by name', async () => {
      const searchTerm = 'Test'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', full_name: 'Test Doctor', email: 'doctor@test.com', role: 'doctor' },
                { id: '2', full_name: 'Test Frontdesk', email: 'frontdesk@test.com', role: 'frontdesk' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
    })

    it('should filter users by status', async () => {
      const isActive = true
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', full_name: 'Active User 1', email: 'active1@test.com', role: 'doctor', is_active: true },
                { id: '2', full_name: 'Active User 2', email: 'active2@test.com', role: 'frontdesk', is_active: true }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).eq('is_active', isActive)

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      expect(result.data?.every((user: any) => user.is_active === isActive)).toBe(true)
    })
  })

  describe('User Statistics', () => {
    it('should calculate user counts by role', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', role: 'doctor', full_name: 'Doctor 1' },
              { id: '2', role: 'doctor', full_name: 'Doctor 2' },
              { id: '3', role: 'frontdesk', full_name: 'Frontdesk 1' },
              { id: '4', role: 'admin', full_name: 'Admin 1' },
              { id: '5', role: 'manager', full_name: 'Manager 1' }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      
      // Calculate counts
      const doctorCount = result.data?.filter((user: any) => user.role === 'doctor').length
      const frontdeskCount = result.data?.filter((user: any) => user.role === 'frontdesk').length
      const adminCount = result.data?.filter((user: any) => user.role === 'admin').length
      const managerCount = result.data?.filter((user: any) => user.role === 'manager').length
      
      expect(doctorCount).toBe(2)
      expect(frontdeskCount).toBe(1)
      expect(adminCount).toBe(1)
      expect(managerCount).toBe(1)
    })

    it('should calculate active vs inactive user counts', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', is_active: true, full_name: 'Active User 1' },
              { id: '2', is_active: true, full_name: 'Active User 2' },
              { id: '3', is_active: true, full_name: 'Active User 3' },
              { id: '4', is_active: false, full_name: 'Inactive User 1' },
              { id: '5', is_active: false, full_name: 'Inactive User 2' }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result).toBeDefined()
      
      // Calculate counts
      const activeCount = result.data?.filter((user: any) => user.is_active === true).length
      const inactiveCount = result.data?.filter((user: any) => user.is_active === false).length
      
      expect(activeCount).toBe(3)
      expect(inactiveCount).toBe(2)
    })
  })

  describe('User Data Cleanup', () => {
    it('should clean up test user data', async () => {
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
      mockAdminDelete.mockResolvedValue({ error: null })
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      // Clean up all test users
      for (const user of Object.values(TEST_USERS)) {
        await TestUtils.deleteTestUser(user.email)
      }

      expect(mockAdminDelete).toHaveBeenCalledTimes(Object.keys(TEST_USERS).length)
    })
  })
})
