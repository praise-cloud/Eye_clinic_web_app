export type UserRole = 'doctor' | 'frontdesk' | 'admin' | 'manager'

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
