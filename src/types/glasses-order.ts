import type { Patient } from './patient'
import type { GlassesInventory } from './inventory'

export interface GlassesOrder {
  id: string
  order_number: string
  patient_id: string
  prescription_id?: string
  frame_id?: string
  lens_type?: string
  lens_coating?: string
  frame_price?: number
  lens_price?: number
  total_price?: number
  status: 'pending' | 'in_lab' | 'ready' | 'dispensed' | 'cancelled'
  deposit_paid: number
  created_by?: string
  dispensed_by?: string
  estimated_ready?: string
  dispensed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  patient?: Patient
  frame?: GlassesInventory
}
