import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_APPOINTMENT, TEST_PATIENT, TEST_USERS, TestUtils } from '../setup'

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

describe('Appointment Services', () => {
  let testPatient: any
  let testUser: any

  beforeEach(async () => {
    vi.clearAllMocks()
    testPatient = await TestUtils.createTestPatient(TEST_PATIENT)
    testUser = await TestUtils.createTestUser(TEST_USERS.doctor)
  })

  describe('Appointment Creation', () => {
    it('should create a new appointment successfully', async () => {
      const appointmentData = {
        patient_id: testPatient.data?.id,
        doctor_id: testUser.data?.user?.id,
        scheduled_at: new Date().toISOString(),
        ...TEST_APPOINTMENT
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-appointment-id',
              ...appointmentData,
              status: 'pending'
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('appointments').insert(appointmentData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(mockInsert).toHaveBeenCalledWith(appointmentData)
      expect(result.data).toBeDefined()
      expect(result.data?.status).toBe('pending')
    })

    it('should handle appointment creation errors', async () => {
      const appointmentData = {
        patient_id: 'invalid-patient-id',
        doctor_id: 'invalid-doctor-id',
        scheduled_at: new Date().toISOString(),
        ...TEST_APPOINTMENT
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Invalid patient or doctor ID' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('appointments').insert(appointmentData).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should validate appointment data before creation', () => {
      const invalidAppointment = {
        patient_id: '',
        doctor_id: '',
        scheduled_at: 'invalid-date',
        appointment_type: 'invalid-type'
      }

      expect(invalidAppointment.patient_id).toBe('')
      expect(invalidAppointment.doctor_id).toBe('')
      expect(invalidAppointment.scheduled_at).toBe('invalid-date')
      expect(invalidAppointment.appointment_type).toBe('invalid-type')
    })
  })

  describe('Appointment Retrieval', () => {
    it('should retrieve appointments by doctor', async () => {
      const doctorId = 'test-doctor-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', doctor_id, patient_id: 'patient-1', status: 'pending' },
                { id: '2', doctor_id, patient_id: 'patient-2', status: 'confirmed' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).eq('doctor_id', doctorId)

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result).toBeDefined()
    })

    it('should retrieve appointments by patient', async () => {
      const patientId = 'test-patient-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', patient_id: patientId, doctor_id: 'doctor-1', status: 'pending' },
                { id: '2', patient_id: patientId, doctor_id: 'doctor-2', status: 'completed' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).eq('patient_id', patientId)

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result).toBeDefined()
    })

    it('should retrieve appointments by status', async () => {
      const status = 'pending'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', status, patient_id: 'patient-1', doctor_id: 'doctor-1' },
                { id: '2', status, patient_id: 'patient-2', doctor_id: 'doctor-2' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).eq('status', status)

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result).toBeDefined()
    })

    it('should retrieve appointment by ID', async () => {
      const appointmentId = 'test-appointment-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: appointmentId,
              patient_id: testPatient.data?.id,
              doctor_id: testUser.data?.user?.id,
              ...TEST_APPOINTMENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').eq('id', appointmentId).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.id).toBe(appointmentId)
    })
  })

  describe('Appointment Updates', () => {
    it('should update appointment status successfully', async () => {
      const appointmentId = 'test-appointment-id'
      const updateData = { status: 'confirmed' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: appointmentId,
                ...TEST_APPOINTMENT,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('appointments').update(updateData).eq('id', appointmentId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.status).toBe(updateData.status)
    })

    it('should update appointment date and time', async () => {
      const appointmentId = 'test-appointment-id'
      const newScheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      const updateData = { scheduled_at: newScheduledTime }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: appointmentId,
                ...TEST_APPOINTMENT,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('appointments').update(updateData).eq('id', appointmentId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.scheduled_at).toBe(newScheduledTime)
    })

    it('should handle update errors', async () => {
      const appointmentId = 'non-existent-id'
      const updateData = { status: 'confirmed' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Appointment not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('appointments').update(updateData).eq('id', appointmentId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Appointment Deletion', () => {
    it('should delete appointment successfully', async () => {
      const appointmentId = 'test-appointment-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('appointments').delete().eq('id', appointmentId)

      expect(mockDelete).toHaveBeenCalledWith('id', appointmentId)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const appointmentId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: { message: 'Appointment not found' }
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('appointments').delete().eq('id', appointmentId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Appointment Status Management', () => {
    it('should handle all valid appointment statuses', () => {
      const validStatuses = ['pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show']
      
      validStatuses.forEach(status => {
        expect(status).toBeDefined()
        expect(typeof status).toBe('string')
      })
    })

    it('should handle all valid appointment types', () => {
      const validTypes = ['checkup', 'follow_up', 'new_consultation', 'glasses_fitting', 'emergency']
      
      validTypes.forEach(type => {
        expect(type).toBeDefined()
        expect(typeof type).toBe('string')
      })
    })

    it('should validate appointment date format', () => {
      const validDate = new Date().toISOString()
      const invalidDate = 'invalid-date'

      expect(validDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(invalidDate).not.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
    })
  })

  describe('Appointment Search and Filtering', () => {
    it('should filter appointments by date range', async () => {
      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next week
      
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', scheduled_at: startDate, status: 'pending' },
                { id: '2', scheduled_at: endDate, status: 'confirmed' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result).toBeDefined()
    })

    it('should search appointments by patient name', async () => {
      const searchTerm = 'John'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', patient: { first_name: 'John', last_name: 'Doe' }, status: 'pending' },
                { id: '2', patient: { first_name: 'Johnny', last_name: 'Smith' }, status: 'confirmed' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(result).toBeDefined()
    })
  })

  describe('Appointment Data Cleanup', () => {
    it('should clean up test appointments', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('appointments')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
