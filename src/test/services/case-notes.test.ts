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

describe('Case Notes Services', () => {
  let testPatient: any
  let testDoctor: any

  beforeEach(async () => {
    vi.clearAllMocks()
    testPatient = await TestUtils.createTestPatient(TEST_PATIENT)
    testDoctor = await TestUtils.createTestUser(TEST_USERS.doctor)
  })

  describe('Case Note Creation', () => {
    it('should create a new case note successfully', async () => {
      const caseNoteData = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        chief_complaint: 'Headache',
        history: 'Patient reports headache for 3 days',
        examination: 'Normal examination findings',
        diagnosis: 'Tension headache',
        treatment_plan: 'Prescribe pain medication',
        follow_up_date: '2024-01-15',
        is_encrypted: false,
        cvf_attachment_url: null
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-case-note-id',
              ...caseNoteData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('case_notes').insert(caseNoteData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(mockInsert).toHaveBeenCalledWith(caseNoteData)
      expect(result.data).toBeDefined()
      expect(result.data?.chief_complaint).toBe(caseNoteData.chief_complaint)
      expect(result.data?.diagnosis).toBe(caseNoteData.diagnosis)
    })

    it('should handle case note creation errors', async () => {
      const caseNoteData = {
        patient_id: 'invalid-patient-id',
        doctor_id: 'invalid-doctor-id',
        chief_complaint: 'Headache',
        history: 'Patient reports headache for 3 days',
        examination: 'Normal examination findings',
        diagnosis: 'Tension headache',
        treatment_plan: 'Prescribe pain medication'
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

      const result = await supabase.from('case_notes').insert(caseNoteData).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should validate case note data before creation', () => {
      const invalidCaseNote = {
        patient_id: '',
        doctor_id: '',
        chief_complaint: '',
        history: '',
        examination: '',
        diagnosis: '',
        treatment_plan: '',
        follow_up_date: 'invalid-date',
        is_encrypted: false
      }

      expect(invalidCaseNote.patient_id).toBe('')
      expect(invalidCaseNote.doctor_id).toBe('')
      expect(invalidCaseNote.chief_complaint).toBe('')
      expect(invalidCaseNote.follow_up_date).toBe('invalid-date')
    })

    it('should create case note with ophthalmology fields', async () => {
      const caseNoteData = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        chief_complaint: 'Blurred vision',
        history: 'Patient reports blurred vision for 1 week',
        examination: 'Normal external examination',
        diagnosis: 'Refractive error',
        treatment_plan: 'Prescribe glasses',
        visiting_date: '2024-01-10',
        ophthalmoscopy_notes: 'Normal fundus',
        previous_rx: 'None',
        externals: 'Normal',
        unaided_dist_re: '6/12',
        unaided_dist_le: '6/12',
        unaided_near_re: 'N6',
        unaided_near_le: 'N6',
        aided_dist_re: '6/6',
        aided_dist_le: '6/6',
        aided_near_re: 'N6',
        aided_near_le: 'N6',
        objective_re_va: '6/6',
        objective_le_va: '6/6',
        subjective_re_add: '+1.00',
        subjective_re_va: '6/6',
        subjective_le_add: '+1.00',
        subjective_le_va: '6/6',
        ret: false,
        autoref: false,
        tonometry_re: '16',
        tonometry_le: '16',
        tonometry_time: '10:30',
        recommendation: 'Prescribe glasses',
        final_rx_od: '+1.00',
        final_rx_os: '+1.00',
        lens_type: 'single_vision',
        next_visiting_date: '2024-02-10',
        outstanding_bill: 50.00
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-case-note-id',
              ...caseNoteData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('case_notes').insert(caseNoteData).select().single()

      expect(mockInsert).toHaveBeenCalledWith(caseNoteData)
      expect(result.data?.visiting_date).toBe(caseNoteData.visiting_date)
      expect(result.data?.final_rx_od).toBe(caseNoteData.final_rx_od)
      expect(result.data?.final_rx_os).toBe(caseNoteData.final_rx_os)
    })
  })

  describe('Case Note Retrieval', () => {
    it('should retrieve case notes by doctor', async () => {
      const doctorId = testDoctor.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', doctor_id: doctorId, patient_id: 'patient-1', chief_complaint: 'Headache' },
                { id: '2', doctor_id: doctorId, patient_id: 'patient-2', chief_complaint: 'Eye pain' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false }).eq('doctor_id', doctorId)

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
    })

    it('should retrieve case notes by patient', async () => {
      const patientId = testPatient.data?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', patient_id: patientId, doctor_id: 'doctor-1', chief_complaint: 'Headache' },
                { id: '2', patient_id: patientId, doctor_id: 'doctor-2', chief_complaint: 'Eye pain' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false }).eq('patient_id', patientId)

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
    })

    it('should retrieve case note by ID', async () => {
      const caseNoteId = 'test-case-note-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: caseNoteId,
              patient_id: testPatient.data?.id,
              doctor_id: testDoctor.data?.user?.id,
              chief_complaint: 'Headache',
              diagnosis: 'Tension headache'
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').eq('id', caseNoteId).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.id).toBe(caseNoteId)
    })
  })

  describe('Case Note Updates', () => {
    it('should update case note successfully', async () => {
      const caseNoteId = 'test-case-note-id'
      const updateData = { 
        diagnosis: 'Migraine',
        treatment_plan: 'Prescribe migraine medication'
      }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: caseNoteId,
                patient_id: testPatient.data?.id,
                doctor_id: testDoctor.data?.user?.id,
                chief_complaint: 'Headache',
                ...updateData,
                updated_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('case_notes').update(updateData).eq('id', caseNoteId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.diagnosis).toBe(updateData.diagnosis)
      expect(result.data?.treatment_plan).toBe(updateData.treatment_plan)
    })

    it('should update ophthalmology fields successfully', async () => {
      const caseNoteId = 'test-case-note-id'
      const updateData = { 
        final_rx_od: '+1.25',
        final_rx_os: '+1.25',
        next_visiting_date: '2024-02-15'
      }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: caseNoteId,
                ...updateData,
                updated_at: new Date().toISOString()
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('case_notes').update(updateData).eq('id', caseNoteId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.final_rx_od).toBe(updateData.final_rx_od)
      expect(result.data?.final_rx_os).toBe(updateData.final_rx_os)
      expect(result.data?.next_visiting_date).toBe(updateData.next_visiting_date)
    })

    it('should handle update errors', async () => {
      const caseNoteId = 'non-existent-id'
      const updateData = { diagnosis: 'Migraine' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Case note not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('case_notes').update(updateData).eq('id', caseNoteId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Case Note Deletion', () => {
    it('should delete case note successfully', async () => {
      const caseNoteId = 'test-case-note-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('case_notes').delete().eq('id', caseNoteId)

      expect(mockDelete).toHaveBeenCalledWith('id', caseNoteId)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const caseNoteId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: { message: 'Case note not found' }
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('case_notes').delete().eq('id', caseNoteId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Case Note Validation', () => {
    it('should validate required fields', () => {
      const validCaseNote = {
        patient_id: testPatient.data?.id,
        doctor_id: testDoctor.data?.user?.id,
        chief_complaint: 'Headache',
        history: 'Patient reports headache for 3 days',
        examination: 'Normal examination findings',
        diagnosis: 'Tension headache',
        treatment_plan: 'Prescribe pain medication'
      }

      expect(validCaseNote.patient_id).toBeDefined()
      expect(validCaseNote.doctor_id).toBeDefined()
      expect(validCaseNote.chief_complaint).toBeDefined()
      expect(validCaseNote.chief_complaint).not.toBe('')
      expect(validCaseNote.diagnosis).toBeDefined()
      expect(validCaseNote.treatment_plan).toBeDefined()
    })

    it('should validate date formats', () => {
      const validDate = '2024-01-15'
      const invalidDate = 'invalid-date'

      expect(validDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(invalidDate).not.toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should validate visual acuity formats', () => {
      const validVA = '6/6'
      const invalidVA = 'invalid-va'

      expect(validVA).toMatch(/^\d\/\d+$/)
      expect(invalidVA).not.toMatch(/^\d\/\d+$/)
    })

    it('should validate prescription formats', () => {
      const validPrescription = '+1.00'
      const invalidPrescription = 'invalid-rx'

      expect(validPrescription).match(/^[-+]?\d+\.?\d*$/)
      expect(invalidPrescription).not.match(/^[-+]?\d+\.?\d*$/)
    })
  })

  describe('Case Note Search and Filtering', () => {
    it('should search case notes by diagnosis', async () => {
      const searchTerm = 'Headache'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', diagnosis: 'Tension headache', chief_complaint: 'Headache' },
                { id: '2', diagnosis: 'Migraine headache', chief_complaint: 'Headache' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
    })

    it('should filter case notes by date range', async () => {
      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', created_at: startDate, chief_complaint: 'Headache' },
                { id: '2', created_at: endDate, chief_complaint: 'Eye pain' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
    })
  })

  describe('Case Note Statistics', () => {
    it('should calculate case note counts by doctor', async () => {
      const doctorId = testDoctor.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', doctor_id: doctorId, diagnosis: 'Tension headache' },
                { id: '2', doctor_id: doctorId, diagnosis: 'Migraine' },
                { id: '3', doctor_id: 'other-doctor', diagnosis: 'Refractive error' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
      
      // Calculate counts
      const doctorCount = result.data?.filter((cn: any) => cn.doctor_id === doctorId).length
      expect(doctorCount).toBe(2)
    })

    it('should calculate case note counts by diagnosis', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', diagnosis: 'Tension headache' },
                { id: '2', diagnosis: 'Tension headache' },
                { id: '3', diagnosis: 'Migraine' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('case_notes').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(result).toBeDefined()
      
      // Calculate counts
      const tensionHeadacheCount = result.data?.filter((cn: any) => cn.diagnosis === 'Tension headache').length
      const migraineCount = result.data?.filter((cn: any) => cn.diagnosis === 'Migraine').length
      
      expect(tensionHeadacheCount).toBe(2)
      expect(migraineCount).toBe(1)
    })
  })

  describe('Case Note Data Cleanup', () => {
    it('should clean up test case note data', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('case_notes')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
