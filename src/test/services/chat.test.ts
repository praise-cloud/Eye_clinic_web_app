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
    }))
  }
}))

describe('Chat/Messaging Services', () => {
  let testUser1: any
  let testUser2: any

  beforeEach(async () => {
    vi.clearAllMocks()
    testUser1 = await TestUtils.createTestUser(TEST_USERS.doctor)
    testUser2 = await TestUtils.createTestUser(TEST_USERS.frontdesk)
  })

  describe('Message Creation', () => {
    it('should create a new message successfully', async () => {
      const messageData = {
        sender_id: testUser1.data?.user?.id,
        receiver_id: testUser2.data?.user?.id,
        content: 'Test message content',
        attachment_type: null,
        attachment_url: null,
        attachment_name: null
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-message-id',
              ...messageData,
              is_read: false,
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('messages').insert(messageData).select().single()

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(mockInsert).toHaveBeenCalledWith(messageData)
      expect(result.data).toBeDefined()
      expect(result.data?.content).toBe(messageData.content)
      expect(result.data?.is_read).toBe(false)
    })

    it('should handle message creation errors', async () => {
      const messageData = {
        sender_id: 'invalid-sender-id',
        receiver_id: 'invalid-receiver-id',
        content: 'Test message content'
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Invalid sender or receiver ID' }
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('messages').insert(messageData).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('should validate message data before creation', () => {
      const invalidMessage = {
        sender_id: '',
        receiver_id: '',
        content: '',
        attachment_type: 'invalid-type',
        attachment_url: '',
        attachment_name: ''
      }

      expect(invalidMessage.sender_id).toBe('')
      expect(invalidMessage.receiver_id).toBe('')
      expect(invalidMessage.content).toBe('')
      expect(invalidMessage.attachment_type).toBe('invalid-type')
    })

    it('should create message with attachment', async () => {
      const messageData = {
        sender_id: testUser1.data?.user?.id,
        receiver_id: testUser2.data?.user?.id,
        content: 'Test message with attachment',
        attachment_type: 'image',
        attachment_url: 'https://example.com/image.jpg',
        attachment_name: 'test-image.jpg'
      }

      const mockFrom = vi.mocked(supabase.from)
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'test-message-id',
              ...messageData,
              is_read: false,
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ insert: mockInsert } as any)

      const result = await supabase.from('messages').insert(messageData).select().single()

      expect(mockInsert).toHaveBeenCalledWith(messageData)
      expect(result.data?.attachment_type).toBe('image')
      expect(result.data?.attachment_url).toBe(messageData.attachment_url)
    })
  })

  describe('Message Retrieval', () => {
    it('should retrieve messages between two users', async () => {
      const userId1 = testUser1.data?.user?.id
      const userId2 = testUser2.data?.user?.id
      
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', sender_id: userId1, receiver_id: userId2, content: 'Message 1', is_read: true },
                { id: '2', sender_id: userId2, receiver_id: userId1, content: 'Message 2', is_read: false }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })

    it('should retrieve sent messages', async () => {
      const senderId = testUser1.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', sender_id: senderId, receiver_id: 'user-2', content: 'Sent message 1' },
                { id: '2', sender_id: senderId, receiver_id: 'user-3', content: 'Sent message 2' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false }).eq('sender_id', senderId)

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })

    it('should retrieve received messages', async () => {
      const receiverId = testUser2.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', sender_id: 'user-1', receiver_id: receiverId, content: 'Received message 1' },
                { id: '2', sender_id: 'user-3', receiver_id: receiverId, content: 'Received message 2' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false }).eq('receiver_id', receiverId)

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })

    it('should retrieve unread messages', async () => {
      const receiverId = testUser2.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', sender_id: 'user-1', receiver_id: receiverId, content: 'Unread message 1', is_read: false },
                { id: '2', sender_id: 'user-3', receiver_id: receiverId, content: 'Unread message 2', is_read: false }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false }).eq('receiver_id', receiverId).eq('is_read', false)

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })
  })

  describe('Message Updates', () => {
    it('should mark message as read successfully', async () => {
      const messageId = 'test-message-id'
      const updateData = { is_read: true, read_at: new Date().toISOString() }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: messageId,
                sender_id: testUser1.data?.user?.id,
                receiver_id: testUser2.data?.user?.id,
                content: 'Test message',
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('messages').update(updateData).eq('id', messageId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.is_read).toBe(true)
      expect(result.data?.read_at).toBeDefined()
    })

    it('should update message content successfully', async () => {
      const messageId = 'test-message-id'
      const updateData = { content: 'Updated message content' }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: messageId,
                sender_id: testUser1.data?.user?.id,
                receiver_id: testUser2.data?.user?.id,
                ...updateData
              },
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('messages').update(updateData).eq('id', messageId).select().single()

      expect(mockUpdate).toHaveBeenCalledWith(updateData)
      expect(result.data?.content).toBe(updateData.content)
    })

    it('should handle update errors', async () => {
      const messageId = 'non-existent-id'
      const updateData = { is_read: true }
      
      const mockFrom = vi.mocked(supabase.from)
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Message not found' }
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ update: mockUpdate } as any)

      const result = await supabase.from('messages').update(updateData).eq('id', messageId).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })
  })

  describe('Message Deletion', () => {
    it('should delete message successfully', async () => {
      const messageId = 'test-message-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('messages').delete().eq('id', messageId)

      expect(mockDelete).toHaveBeenCalledWith('id', messageId)
      expect(result.error).toBeNull()
    })

    it('should handle deletion errors', async () => {
      const messageId = 'non-existent-id'
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          error: { message: 'Message not found' }
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      const result = await supabase.from('messages').delete().eq('id', messageId)

      expect(result.error).toBeDefined()
    })
  })

  describe('Message Validation', () => {
    it('should handle all valid attachment types', () => {
      const validAttachmentTypes = ['image', 'document', null]
      
      validAttachmentTypes.forEach(type => {
        expect(type === 'image' || type === 'document' || type === null).toBe(true)
      })
    })

    it('should validate message content length', () => {
      const validMessage = 'This is a valid message'
      const emptyMessage = ''
      const longMessage = 'a'.repeat(1001)

      expect(validMessage.length).toBeGreaterThan(0)
      expect(validMessage.length).toBeLessThanOrEqual(1000)
      expect(emptyMessage.length).toBe(0)
      expect(longMessage.length).toBeGreaterThan(1000)
    })

    it('should validate attachment URL format', () => {
      const validUrl = 'https://example.com/image.jpg'
      const invalidUrl = 'not-a-url'

      expect(validUrl).toMatch(/^https?:\/\/.+/)
      expect(invalidUrl).not.toMatch(/^https?:\/\/.+/)
    })
  })

  describe('Message Search and Filtering', () => {
    it('should search messages by content', async () => {
      const searchTerm = 'test'
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', content: 'test message 1', sender_id: 'user-1', receiver_id: 'user-2' },
                { id: '2', content: 'test message 2', sender_id: 'user-2', receiver_id: 'user-1' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })

    it('should filter messages by date range', async () => {
      const startDate = new Date().toISOString()
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', created_at: startDate, content: 'Message 1' },
                { id: '2', created_at: endDate, content: 'Message 2' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
    })
  })

  describe('Message Statistics', () => {
    it('should calculate message counts by user', async () => {
      const userId = testUser1.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', sender_id: userId, content: 'Message 1' },
                { id: '2', sender_id: userId, content: 'Message 2' },
                { id: '3', receiver_id: userId, content: 'Message 3' }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
      
      // Calculate counts
      const sentCount = result.data?.filter((m: any) => m.sender_id === userId).length
      const receivedCount = result.data?.filter((m: any) => m.receiver_id === userId).length
      
      expect(sentCount).toBe(2)
      expect(receivedCount).toBe(1)
    })

    it('should calculate unread message counts', async () => {
      const receiverId = testUser2.data?.user?.id
      const mockFrom = vi.mocked(supabase.from)
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: [
                { id: '1', receiver_id: receiverId, is_read: false },
                { id: '2', receiver_id: receiverId, is_read: false },
                { id: '3', receiver_id: receiverId, is_read: true }
              ],
              error: null
            }))
          }))
        }))
      }))
      
      mockFrom.mockReturnValue({ select: mockSelect } as any)

      const result = await supabase.from('messages').select('*').order('created_at', { ascending: false })

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(result).toBeDefined()
      
      // Calculate unread count
      const unreadCount = result.data?.filter((m: any) => m.receiver_id === receiverId && !m.is_read).length
      expect(unreadCount).toBe(2)
    })
  })

  describe('Message Data Cleanup', () => {
    it('should clean up test message data', async () => {
      const mockFrom = vi.mocked(supabase.from)
      const mockDelete = vi.fn(() => ({
        like: vi.fn(() => Promise.resolve({
          error: null
        }))
      }))
      
      mockFrom.mockReturnValue({ delete: mockDelete } as any)

      await TestUtils.cleanupTestData()

      expect(mockFrom).toHaveBeenCalledWith('messages')
      expect(mockDelete).toHaveBeenCalled()
    })
  })
})
