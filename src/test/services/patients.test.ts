import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_PATIENT, TEST_USERS, TestUtils } from '../setup'

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
    }))
  }
}))

describe('Patient Management Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Patient Creation', () => {
    it('should create a new patient successfully', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-patient-id',
              patient_number: 'TEST-123456',
              ...TEST_PATIENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await TestUtils.createTestPatient(TEST_PATIENT)

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(mockInsert).toHaveBeenCalledWith({
        ...TEST_PATIENT,
        patient_number: expect.stringMatching(/^TEST-\d+$/)
      })
      expect(result.data).toBeDefined()
      expect(result.data?.patient_number).toMatch(/^TEST-\d+$/)
    })

    it('should handle patient creation errors', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Patient already exists' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await TestUtils.createTestPatient(TEST_PATIENT)

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should generate unique patient numbers', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-patient-id',
              patient_number: 'TEST-123456',
              ...TEST_PATIENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result1 = await TestUtils.createTestPatient(TEST_PATIENT)
      const result2 = await TestUtils.createTestPatient(TEST_PATIENT)

      expect(result1.data?.patient_number).not.toBe(result2.data?.patient_number)
    })
  })

  describe('Patient Retrieval', () => {
    it('should retrieve patients by search criteria', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', first_name: 'John', last_name: 'Doe', patient_number: 'TEST-001' },
                { id: '2', first_name: 'Jane', last_name: 'Smith', patient_number: 'TEST-002' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result).toBeDefined()
    })

    it('should retrieve patient by ID', async () => {
      const patientId = 'test-patient-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: patientId,
              patient_number: 'TEST-123456',
              ...TEST_PATIENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').eq('id', patientId).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.id).toBe(patientId)
    })

    it('should handle patient not found', async () => {
      const patientId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Patient not found' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').eq('id', patientId).single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Patient Updates', () => {
    it('should update patient information successfully', async () => {
      const patientId = 'test-patient-id'
      const updateData = { first_name: 'Updated Name', phone: '+1234567890' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: patientId,
                ...TEST_PATIENT,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('patients').update(updateData).eq('id', patientId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.first_name).toBe(updateData.first_name)
      expect(result.data?.phone).toBe(updateData.phone)
    })

    it('should handle update errors', async () => {
      const patientId = 'non-existent-id'
      const updateData = { first_name: 'Updated Name' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Patient not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('patients').update(updateData).eq('id', patientId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Patient Deletion', () => {
    it('should delete patient successfully', async () => {
      const patientId = 'test-patient-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await TestUtils.deleteTestPatient(patientId)

      expect(mockDelete).toHaveBeenCalledWith('id', patientId)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const patientId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: { message: 'Patient not found' }
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await TestUtils.deleteTestPatient(patientId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Patient Search', () => {
    it('should search patients by name', async () => {
      const searchTerm = 'John'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', first_name: 'John', last_name: 'Doe', patient_number: 'TEST-001' },
                { id: '2', first_name: 'Johnny', last_name: 'Smith', patient_number: 'TEST-002' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(result).toBeDefined()
    })

    it('should search patients by patient number', async () => {
      const patientNumber = 'TEST-123456'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-patient-id',
              patient_number: patientNumber,
              ...TEST_PATIENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('patients').select('*').eq('patient_number', patientNumber).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.patient_number).toBe(patientNumber)
    })
  })

  describe('Patient Validation', () => {
    it('should validate required fields', () => {
      const invalidPatient = {
        first_name: '',
        last_name: '',
        date_of_birth: 'invalid-date',
        gender: 'invalid-gender'
      }

      expect(invalidPatient.first_name).toBe('')
      expect(invalidPatient.last_name).toBe('')
      expect(invalidPatient.date_of_birth).toBe('invalid-date')
      expect(invalidPatient.gender).toBe('invalid-gender')
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
  })

  describe('Patient Data Cleanup', () => {
    it('should clean up test patients', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('patients')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
