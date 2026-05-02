export type UserRole = 'doctor' | 'assistant' | 'admin' | 'accountant'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
