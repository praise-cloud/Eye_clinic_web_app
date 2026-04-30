import type { Profile } from './profile'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at?: string
  attachment_type?: 'image' | 'document' | null
  attachment_url?: string | null
  attachment_name?: string | null
  sender?: Profile
  receiver?: Profile
}
