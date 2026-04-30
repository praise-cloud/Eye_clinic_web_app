export interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  phone?: string
  email?: string
  address?: string
  occupation?: string
  next_of_kin_name?: string
  next_of_kin_phone?: string
  allergies?: string
  subscription_type?: 'none' | 'basic' | 'standard' | 'premium'
  subscription_start?: string
  subscription_end?: string
  registered_by?: string
  created_at: string
  updated_at: string
}
