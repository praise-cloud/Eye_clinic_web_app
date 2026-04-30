import type { Patient } from './patient'
import type { Profile } from './profile'

export interface Payment {
  id: string
  receipt_number: string
  patient_id: string
  payment_type: 'consultation' | 'drug' | 'glasses_deposit' | 'glasses_balance' | 'subscription' | 'other'
  reference_id?: string
  amount: number
  payment_method?: 'cash' | 'transfer' | 'pos' | 'other'
  received_by?: string
  notes?: string
  paid_at: string
  patient?: Patient
  receiver?: Profile
}
