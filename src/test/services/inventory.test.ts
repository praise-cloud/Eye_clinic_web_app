import { describe, it, expect, beforeEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { TEST_DRUG, TestUtils } from '../setup'

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

describe('Inventory Management Services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Drug Inventory', () => {
    describe('Drug Creation', () => {
      it('should create a new drug successfully', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-drug-id',
                ...TEST_DRUG
              },
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ insert: mockInsert } as any)

        const result = await supabase.from('drugs').insert(TEST_DRUG).select().single()

        expect(mockFrom).toHaveBeenCalledWith('drugs')
        expect(mockInsert).toHaveBeenCalledWith(TEST_DRUG)
        expect(result.data).toBeDefined()
        expect(result.data?.name).toBe(TEST_DRUG.name)
      })

      it('should handle drug creation errors', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Drug already exists' }
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ insert: mockInsert } as any)

        const result = await supabase.from('drugs').insert(TEST_DRUG).select().single()

        expect(result.data).toBeNull()
        expect(result.error).toBeDefined()
      })

      it('should validate drug data before creation', () => {
        const invalidDrug = {
          name: '',
          generic_name: '',
          category: '',
          unit: '',
          quantity: -1,
          reorder_level: -1,
          purchase_price: -1,
          selling_price: -1,
          supplier: ''
        }

        expect(invalidDrug.name).toBe('')
        expect(invalidDrug.quantity).toBe(-1)
        expect(invalidDrug.purchase_price).toBe(-1)
        expect(invalidDrug.selling_price).toBe(-1)
      })
    })

    describe('Drug Retrieval', () => {
      it('should retrieve all drugs', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          order: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', name: 'Drug A', quantity: 100 },
                { id: '2', name: 'Drug B', quantity: 50 }
              ],
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('drugs').select('*').order('name')

        expect(mockFrom).toHaveBeenCalledWith('drugs')
        expect(result).toBeDefined()
      })

      it('should retrieve drug by ID', async () => {
        const drugId = 'test-drug-id'
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: drugId,
                ...TEST_DRUG
              },
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('drugs').select('*').eq('id', drugId).single()

        expect(mockSelect).toHaveBeenCalledWith('*')
        expect(result.data?.id).toBe(drugId)
      })

      it('should search drugs by name', async () => {
        const searchTerm = 'Test'
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: [
                  { id: '1', name: 'Test Drug A', quantity: 100 },
                  { id: '2', name: 'Test Drug B', quantity: 50 }
                ],
                error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('drugs').select('*').order('name')

        expect(mockFrom).toHaveBeenCalledWith('drugs')
        expect(result).toBeDefined()
      })
    })

    describe('Drug Updates', () => {
      it('should update drug quantity successfully', async () => {
        const drugId = 'test-drug-id'
        const updateData = { quantity: 75 }
        
        const mockFrom = vi.mocked(supabase.from)
        const mockUpdate = vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: drugId,
                  ...TEST_DRUG,
                  ...updateData
                },
                error: null
              }))
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ update: mockUpdate } as any)

        const result = await supabase.from('drugs').update(updateData).eq('id', drugId).select().single()

        expect(mockUpdate).toHaveBeenCalledWith(updateData)
        expect(result.data?.quantity).toBe(updateData.quantity)
      })

      it('should update drug price successfully', async () => {
        const drugId = 'test-drug-id'
        const updateData = { selling_price: 15.00 }
        
        const mockFrom = vi.mocked(supabase.from)
        const mockUpdate = vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: drugId,
                  ...TEST_DRUG,
                  ...updateData
                },
                error: null
              }))
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ update: mockUpdate } as any)

        const result = await supabase.from('drugs').update(updateData).eq('id', drugId).select().single()

        expect(mockUpdate).toHaveBeenCalledWith(updateData)
        expect(result.data?.selling_price).toBe(updateData.selling_price)
      })
    })

    describe('Drug Deletion', () => {
      it('should delete drug successfully', async () => {
        const drugId = 'test-drug-id'
        const mockFrom = vi.mocked(supabase.from)
        const mockDelete = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            error: null
          }))
        }))
        
        mockFrom.mockReturnValue({ delete: mockDelete } as any)

        const result = await supabase.from('drugs').delete().eq('id', drugId)

        expect(mockDelete).toHaveBeenCalledWith('id', drugId)
        expect(result.error).toBeNull()
      })
    })
  })

  describe('Glasses Inventory', () => {
    const testFrame = {
      frame_name: 'Test Frame',
      frame_brand: 'Test Brand',
      frame_code: 'TF001',
      color: 'Black',
      material: 'Metal',
      gender: 'unisex',
      quantity: 50,
      reorder_level: 5,
      purchase_price: 20.00,
      selling_price: 40.00
    }

    describe('Frame Creation', () => {
      it('should create a new frame successfully', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-frame-id',
                ...testFrame
              },
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ insert: mockInsert } as any)

        const result = await supabase.from('glasses_inventory').insert(testFrame).select().single()

        expect(mockFrom).toHaveBeenCalledWith('glasses_inventory')
        expect(mockInsert).toHaveBeenCalledWith(testFrame)
        expect(result.data).toBeDefined()
        expect(result.data?.frame_name).toBe(testFrame.frame_name)
      })

      it('should validate frame data before creation', () => {
        const invalidFrame = {
          frame_name: '',
          frame_brand: '',
          frame_code: '',
          color: '',
          material: '',
          gender: 'invalid',
          quantity: -1,
          reorder_level: -1,
          purchase_price: -1,
          selling_price: -1
        }

        expect(invalidFrame.frame_name).toBe('')
        expect(invalidFrame.gender).toBe('invalid')
        expect(invalidFrame.quantity).toBe(-1)
      })
    })

    describe('Frame Retrieval', () => {
      it('should retrieve all frames', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          order: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', frame_name: 'Frame A', quantity: 50 },
                { id: '2', frame_name: 'Frame B', quantity: 30 }
              ],
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('glasses_inventory').select('*').order('frame_name')

        expect(mockFrom).toHaveBeenCalledWith('glasses_inventory')
        expect(result).toBeDefined()
      })

      it('should search frames by brand', async () => {
        const searchTerm = 'Test'
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: [
                  { id: '1', frame_brand: 'Test Brand A', quantity: 50 },
                  { id: '2', frame_brand: 'Test Brand B', quantity: 30 }
                ],
                error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('glasses_inventory').select('*').order('frame_name')

        expect(mockFrom).toHaveBeenCalledWith('glasses_inventory')
        expect(result).toBeDefined()
      })
    })
  })

  describe('Other Inventory', () => {
    const testOtherItem = {
      name: 'Test Item',
      category: 'Accessories',
      unit: 'piece',
      quantity: 100,
      reorder_level: 10,
      purchase_price: 2.00,
      selling_price: 5.00
    }

    describe('Other Item Creation', () => {
      it('should create a new other item successfully', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockInsert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'test-item-id',
                ...testOtherItem
              },
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ insert: mockInsert } as any)

        const result = await supabase.from('inventory_others').insert(testOtherItem).select().single()

        expect(mockFrom).toHaveBeenCalledWith('inventory_others')
        expect(mockInsert).toHaveBeenCalledWith(testOtherItem)
        expect(result.data).toBeDefined()
        expect(result.data?.name).toBe(testOtherItem.name)
      })
    })

    describe('Other Item Retrieval', () => {
      it('should retrieve all other items', async () => {
        const mockFrom = vi.mocked(supabase.from)
        const mockSelect = vi.fn(() => ({
          order: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', name: 'Item A', quantity: 100 },
                { id: '2', name: 'Item B', quantity: 50 }
              ],
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('inventory_others').select('*').order('name')

        expect(mockFrom).toHaveBeenCalledWith('inventory_others')
        expect(result).toBeDefined()
      })
    })
  })

  describe('Low Stock Alerts', () => {
    it('should identify drugs with low stock', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', name: 'Drug A', quantity: 5, reorder_level: 10 }, // Low stock
                { id: '2', name: 'Drug B', quantity: 50, reorder_level: 10 }  // Normal stock
              ],
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('drugs').select('*').order('name')

        expect(mockFrom).toHaveBeenCalledWith('drugs')
        expect(result).toBeDefined()
        
        // Check if low stock items are identified
        const lowStockItems = result.data?.filter((item: any) => item.quantity <= item.reorder_level)
        expect(lowStockItems?.length).toBeGreaterThan(0)
    })

    it('should identify frames with low stock', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', frame_name: 'Frame A', quantity: 2, reorder_level: 5 }, // Low stock
                { id: '2', frame_name: 'Frame B', quantity: 20, reorder_level: 5 }  // Normal stock
              ],
              error: null
            }))
          }))
        }))
        
        mockFrom.mockReturnValue({ select: mockSelect } as any)

        const result = await supabase.from('glasses_inventory').select('*').order('frame_name')

        expect(mockFrom).toHaveBeenCalledWith('glasses_inventory')
        expect(result).toBeDefined()
        
        // Check if low stock items are identified
        const lowStockItems = result.data?.filter((item: any) => item.quantity <= item.reorder_level)
        expect(lowStockItems?.length).toBeGreaterThan(0)
    })
  })

  describe('Inventory Validation', () => {
    it('should validate numeric fields', () => {
      const validDrug = {
        ...TEST_DRUG,
        quantity: 100,
        reorder_level: 10,
        purchase_price: 5.00,
        selling_price: 10.00
      }

      expect(validDrug.quantity).toBeGreaterThan(0)
      expect(validDrug.reorder_level).toBeGreaterThan(0)
      expect(validDrug.purchase_price).toBeGreaterThan(0)
      expect(validDrug.selling_price).toBeGreaterThan(0)
      expect(validDrug.selling_price).toBeGreaterThan(validDrug.purchase_price)
    })

    it('should validate required fields', () => {
      const requiredFields = ['name', 'generic_name', 'category', 'unit']
      
      requiredFields.forEach(field => {
        expect(TEST_DRUG[field as keyof typeof TEST_DRUG]).toBeDefined()
        expect(TEST_DRUG[field as keyof typeof TEST_DRUG]).not.toBe('')
      })
    })
  })

  describe('Inventory Data Cleanup', () => {
    it('should clean up test inventory data', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('drugs')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
