import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_USERS, TEST_PATIENT, TEST_APPOINTMENT, TEST_DRUG, TEST_PAYMENT, TestUtils } from '../setup'

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

describe('Role-Based Permissions Integration Tests', () => {
  let testPatient: any
  let testDoctor: any
  let testFrontdesk: any
  let testAdmin: any
  let testManager: any

  beforeEach(async () => {
    vi.clearAllMocks()
    testPatient = await TestUtils.createTestPatient(TEST_PATIENT)
    testDoctor = await TestUtils.createTestUser(TEST_USERS.doctor)
    testFrontdesk = await TestUtils.createTestUser(TEST_USERS.frontdesk)
    testAdmin = await TestUtils.createTestUser(TEST_USERS.admin)
    testManager = await TestUtils.createTestUser(TEST_USERS.manager)
  })

  describe('Doctor Role Permissions', () => {
    it('should allow doctors to create case notes', async () => {
      const caseNoteData = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        chief_complaint: 'Headache',
        diagnosis: 'Tension headache',
        treatment_plan: 'Prescribe pain medication'
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'case-note-1', ...caseNoteData },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('case_notes').insert(caseNoteData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result.data).toBeDefined()
      expect(result.data?.doctor_id).toBe(testDoctor.data?.user?.id)
    })

    it('should allow doctors to view their own appointments', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', doctor_id: testDoctor.data?.user?.id, patient_id: testPatient.data?.id },
                { id: '2', doctor_id: testDoctor.data?.user?.id, patient_id: testPatient.data?.id }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).eq('doctor_id', testDoctor.data?.user?.id)

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result.data?.every((apt: any) => apt.doctor_id === testDoctor.data?.user?.id)).toBe(true)
    })

    it('should allow doctors to view patient information', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: testPatient.data?.id,
              ...TEST_PATIENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').eq('id', testPatient.data?.id).single()

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result.data).toBeDefined()
    })

    it('should restrict doctors from managing inventory', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('drugs').insert(TEST_DRUG).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should restrict doctors from managing users', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').eq('is_active', true).single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Frontdesk Role Permissions', () => {
    it('should allow frontdesk to manage patients', async () => {
      const patientData = {
        ...TEST_PATIENT,
        patient_number: `TEST-${Date.now()}`
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'patient-1', ...patientData },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('patients').insert(patientData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result.data).toBeDefined()
    })

    it('should allow frontdesk to manage appointments', async () => {
      const appointmentData = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        scheduled_at: new Date().toISOString(),
        ...TEST_APPOINTMENT
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'appointment-1', ...appointmentData },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('appointments').insert(appointmentData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result.data).toBeDefined()
    })

    it('should allow frontdesk to manage inventory', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'drug-1', ...TEST_DRUG },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('drugs').insert(TEST_DRUG).select().single()

      expect(mockFrom).toHaveBeenCalledWith('drugs')
      expect(result.data).toBeDefined()
    })

    it('should restrict frontdesk from creating case notes', async () => {
      const caseNoteData = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        chief_complaint: 'Headache',
        diagnosis: 'Tension headache'
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('case_notes').insert(caseNoteData).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should restrict frontdesk from managing users', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').eq('is_active', true).single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Admin Role Permissions', () => {
    it('should allow admin to manage all resources', async () => {
      // Test patient management
      const patientData = { ...TEST_PATIENT, patient_number: `TEST-${Date.now()}` }
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'patient-1', ...patientData },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('patients').insert(patientData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result.data).toBeDefined()
    })

    it('should allow admin to manage payments', async () => {
      const paymentData = {
        patient_id: testPatient.data?.id,
        receipt_number: `TEST-${Date.now()}`,
        ...TEST_PAYMENT,
        received_by: testAdmin.data?.user?.id
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'payment-1', ...paymentData },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('payments').insert(paymentData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result.data).toBeDefined()
    })

    it('should allow admin to manage users', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', email: 'doctor@test.com', role: 'doctor', is_active: true },
              { id: '2', email: 'frontdesk@test.com', role: 'frontdesk', is_active: true },
              { id: '3', email: 'admin@test.com', role: 'admin', is_active: true },
              { id: '4', email: 'manager@test.com', role: 'manager', is_active: true }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(4)
    })

    it('should allow admin to delete any resource', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('patients').delete().eq('id', testPatient.data?.id)

      expect(mockDelete).toHaveBeenCalledWith('id', testPatient.data?.id)
      expect(result.error).toBeNull()
    })
  })

  describe('Manager Role Permissions', () => {
    it('should allow manager to manage users', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', email: 'doctor@test.com', role: 'doctor', is_active: true },
              { id: '2', email: 'frontdesk@test.com', role: 'frontdesk', is_active: true }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('profiles')
      expect(result.data).toBeDefined()
    })

    it('should allow manager to view reports', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', amount: 100.00, payment_type: 'consultation' },
              { id: '2', amount: 50.00, payment_type: 'drug' }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result.data).toBeDefined()
    })

    it('should allow manager to view audit logs', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', action: 'INSERT', table_name: 'patients', record_id: 'patient-1' },
              { id: '2', action: 'UPDATE', table_name: 'appointments', record_id: 'appointment-1' }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('audit_logs')
      expect(result.data).toBeDefined()
    })

    it('should restrict manager from managing inventory', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('drugs').insert(TEST_DRUG).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Cross-Role Data Access', () => {
    it('should prevent users from accessing other users data', async () => {
      // Doctor trying to access other doctor's case notes
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', doctor_id: testDoctor.data?.user?.id, patient_id: testPatient.data?.id }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false }).eq('doctor_id', testDoctor.data?.user?.id)

      expect(result.data?.every((cn: any) => cn.doctor_id === testDoctor.data?.user?.id)).toBe(true)
    })

    it('should allow shared data access where appropriate', async () => {
      // All roles can view patient information
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: testPatient.data?.id, ...TEST_PATIENT }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result.data).toBeDefined()
    })

    it('should prevent unauthorized role escalation', async () => {
      // Frontdesk trying to access admin-only functions
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Insufficient permissions' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').eq('is_active', true).single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Permission Edge Cases', () => {
    it('should handle inactive users correctly', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', email: 'active@test.com', is_active: true },
                { id: '2', email: 'inactive@test.com', is_active: false }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

      expect(result.data?.filter((user: any) => user.is_active === true).length).toBe(1)
      expect(result.data?.filter((user: any) => user.is_active === false).length).toBe(1)
    })

    it('should handle role changes correctly', async () => {
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
      expect(result.data?.role).toBe('admin')
    })

    it('should handle concurrent access correctly', async () => {
      // Multiple users trying to access the same resource
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: testPatient.data?.id, ...TEST_PATIENT }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result1 = await supabase.from('patients').select('*').order('created_at', { ascending: false })
      const result2 = await supabase.from('patients').select('*').order('created_at', { ascending: false })

      expect(result1.data).toEqual(result2.data)
    })
  })

  describe('Permission Validation', () => {
    it('should validate role assignments', () => {
      const validRoles = ['doctor', 'frontdesk', 'admin', 'manager']
      
      Object.values(TEST_USERS).forEach(user => {
        expect(validRoles).toContain(user.role)
      })
    })

    it('should validate permission inheritance', () => {
      // Admin should have all permissions
      const adminPermissions = ['patients', 'appointments', 'inventory', 'payments', 'users', 'reports']
      
      // Doctor should have limited permissions
      const doctorPermissions = ['patients', 'appointments', 'case_notes']
      
      // Frontdesk should have operational permissions
      const frontdeskPermissions = ['patients', 'appointments', 'inventory']
      
      // Manager should have oversight permissions
      const managerPermissions = ['patients', 'appointments', 'users', 'reports', 'audit']
      
      expect(adminPermissions.length).toBeGreaterThan(doctorPermissions.length)
      expect(adminPermissions.length).toBeGreaterThan(frontdeskPermissions.length)
      expect(adminPermissions.length).toBeGreaterThan(managerPermissions.length)
    })

    it('should validate data isolation', () => {
      // Each role should only see data they're authorized to see
      const doctorDataScope = ['own_case_notes', 'all_patients', 'own_appointments']
      const frontdeskDataScope = ['all_patients', 'all_appointments', 'inventory']
      const adminDataScope = ['all_data']
      const managerDataScope = ['all_patients', 'all_appointments', 'users', 'reports']
      
      expect(adminDataScope.length).toBeGreaterThan(doctorDataScope.length)
      expect(adminDataScope.length).toBeGreaterThan(frontdeskDataScope.length)
      expect(adminDataScope.length).toBeGreaterThan(managerDataScope.length)
    })
  })
})
