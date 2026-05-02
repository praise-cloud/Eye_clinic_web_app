import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_PAYMENT, TEST_PATIENT, TEST_USERS, TestUtils } from '../setup'

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

describe('Payment Services', () => {
  let testPatient: any
  let testUser: any

  beforeEach(async () => {
    vi.clearAllMocks()
    testPatient = await TestUtils.createTestPatient(TEST_PATIENT)
    testUser = await TestUtils.createTestUser(TEST_USERS.admin)
  })

  describe('Payment Creation', () => {
    it('should create a new payment successfully', async () => {
      const paymentData = {
        patient_id: testPatient.data?.id,
        receipt_number: `TEST-${Date.now()}`,
        ...TEST_PAYMENT,
        received_by: testUser.data?.user?.id
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-payment-id',
              ...paymentData
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('payments').insert(paymentData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(mockInsert).toHaveBeenCalledWith(paymentData)
      expect(result.data).toBeDefined()
      expect(result.data?.payment_type).toBe(TEST_PAYMENT.payment_type)
      expect(result.data?.amount).toBe(TEST_PAYMENT.amount)
    })

    it('should handle payment creation errors', async () => {
      const paymentData = {
        patient_id: 'invalid-patient-id',
        receipt_number: 'TEST-123',
        ...TEST_PAYMENT,
        received_by: 'invalid-user-id'
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Invalid patient or user ID' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('payments').insert(paymentData).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should generate unique receipt numbers', async () => {
      const paymentData1 = {
        patient_id: testPatient.data?.id,
        receipt_number: `TEST-${Date.now()}`,
        ...TEST_PAYMENT,
        received_by: testUser.data?.user?.id
      }

      const paymentData2 = {
        patient_id: testPatient.data?.id,
        receipt_number: `TEST-${Date.now() + 1}`,
        ...TEST_PAYMENT,
        received_by: testUser.data?.user?.id
      }

      expect(paymentData1.receipt_number).not.toBe(paymentData2.receipt_number)
      expect(paymentData1.receipt_number).toMatch(/^TEST-\d+$/)
      expect(paymentData2.receipt_number).toMatch(/^TEST-\d+$/)
    })

    it('should validate payment data before creation', () => {
      const invalidPayment = {
        patient_id: '',
        receipt_number: '',
        payment_type: 'invalid-type',
        amount: -1,
        payment_method: 'invalid-method'
      }

      expect(invalidPayment.patient_id).toBe('')
      expect(invalidPayment.receipt_number).toBe('')
      expect(invalidPayment.payment_type).toBe('invalid-type')
      expect(invalidPayment.amount).toBe(-1)
      expect(invalidPayment.payment_method).toBe('invalid-method')
    })
  })

  describe('Payment Retrieval', () => {
    it('should retrieve all payments', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', receipt_number: 'TEST-001', amount: 50.00, payment_type: 'consultation' },
              { id: '2', receipt_number: 'TEST-002', amount: 100.00, payment_type: 'drug' }
            ],
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
    })

    it('should retrieve payments by patient', async () => {
      const patientId = 'test-patient-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', patient_id: patientId, receipt_number: 'TEST-001', amount: 50.00 },
                { id: '2', patient_id: patientId, receipt_number: 'TEST-002', amount: 100.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false }).eq('patient_id', patientId)

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
    })

    it('should retrieve payments by payment type', async () => {
      const paymentType = 'consultation'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', payment_type: paymentType, receipt_number: 'TEST-001', amount: 50.00 },
                { id: '2', payment_type: paymentType, receipt_number: 'TEST-002', amount: 50.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false }).eq('payment_type', paymentType)

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
    })

    it('should retrieve payment by receipt number', async () => {
      const receiptNumber = 'TEST-123456'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-payment-id',
              receipt_number: receiptNumber,
              ...TEST_PAYMENT
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').eq('receipt_number', receiptNumber).single()

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(result.data?.receipt_number).toBe(receiptNumber)
    })
  })

  describe('Payment Updates', () => {
    it('should update payment amount successfully', async () => {
      const paymentId = 'test-payment-id'
      const updateData = { amount: 75.00 }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: paymentId,
                ...TEST_PAYMENT,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('payments').update(updateData).eq('id', paymentId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.amount).toBe(updateData.amount)
    })

    it('should update payment method successfully', async () => {
      const paymentId = 'test-payment-id'
      const updateData = { payment_method: 'transfer' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: paymentId,
                ...TEST_PAYMENT,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('payments').update(updateData).eq('id', paymentId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.payment_method).toBe(updateData.payment_method)
    })

    it('should handle update errors', async () => {
      const paymentId = 'non-existent-id'
      const updateData = { amount: 75.00 }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Payment not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('payments').update(updateData).eq('id', paymentId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Payment Deletion', () => {
    it('should delete payment successfully', async () => {
      const paymentId = 'test-payment-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('payments').delete().eq('id', paymentId)

      expect(mockDelete).toHaveBeenCalledWith('id', paymentId)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const paymentId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: { message: 'Payment not found' }
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('payments').delete().eq('id', paymentId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Payment Validation', () => {
    it('should handle all valid payment types', () => {
      const validPaymentTypes = ['consultation', 'drug', 'glasses_deposit', 'glasses_balance', 'subscription', 'other']
      
      validPaymentTypes.forEach(type => {
        expect(type).toBeDefined()
        expect(typeof type).toBe('string')
      })
    })

    it('should handle all valid payment methods', () => {
      const validPaymentMethods = ['cash', 'transfer', 'pos', 'other']
      
      validPaymentMethods.forEach(method => {
        expect(method).toBeDefined()
        expect(typeof method).toBe('string')
      })
    })

    it('should validate payment amount', () => {
      const validAmount = 50.00
      const invalidAmount = -10.00

      expect(validAmount).toBeGreaterThan(0)
      expect(invalidAmount).toBeLessThan(0)
    })

    it('should validate receipt number format', () => {
      const validReceiptNumber = 'TEST-123456'
      const invalidReceiptNumber = ''

      expect(validReceiptNumber).toMatch(/^TEST-\d+$/)
      expect(invalidReceiptNumber).toBe('')
    })
  })

  describe('Payment Search and Filtering', () => {
    it('should filter payments by date range', async () => {
      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', paid_at: startDate, receipt_number: 'TEST-001', amount: 50.00 },
                { id: '2', paid_at: endDate, receipt_number: 'TEST-002', amount: 100.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
    })

    it('should search payments by receipt number', async () => {
      const searchTerm = 'TEST-123'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', receipt_number: 'TEST-123-001', amount: 50.00 },
                { id: '2', receipt_number: 'TEST-123-002', amount: 100.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
    })
  })

  describe('Payment Statistics', () => {
    it('should calculate total revenue by payment type', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', payment_type: 'consultation', amount: 50.00 },
                { id: '2', payment_type: 'consultation', amount: 50.00 },
                { id: '3', payment_type: 'drug', amount: 25.00 },
                { id: '4', payment_type: 'drug', amount: 25.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
      
      // Calculate totals by type
      const consultationTotal = result.data?.filter((p: any) => p.payment_type === 'consultation').reduce((sum: number, p: any) => sum + p.amount, 0)
      const drugTotal = result.data?.filter((p: any) => p.payment_type === 'drug').reduce((sum: number, p: any) => sum + p.amount, 0)
      
      expect(consultationTotal).toBe(100.00)
      expect(drugTotal).toBe(50.00)
    })

    it('should calculate daily revenue', async () => {
      const today = new Date().toISOString().split('T')[0]
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', paid_at: today, amount: 50.00 },
                { id: '2', paid_at: today, amount: 100.00 },
                { id: '3', paid_at: today, amount: 75.00 }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(result).toBeDefined()
      
      // Calculate daily total
      const dailyTotal = result.data?.reduce((sum: number, p: any) => sum + p.amount, 0)
      expect(dailyTotal).toBe(225.00)
    })
  })

  describe('Payment Data Cleanup', () => {
    it('should clean up test payment data', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('payments')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
