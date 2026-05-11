import type { UserRole } from './profile'
import type { Patient } from './patient'
import type { Profile } from './profile'
import type { Drug, GlassesInventory, InventoryOthers } from './inventory'

export type { UserRole } from './profile'
export type { Patient } from './patient'
export type { Profile } from './profile'
export type { Drug, GlassesInventory, InventoryOthers } from './inventory'

export interface DailySummary {
  summary_date: string
  new_patients: number
  returning_patients: number
  drug_revenue: number
  glasses_revenue: number
  consultation_revenue: number
  subscription_revenue: number
  total_revenue: number
}

export interface DrugDispensing {
  id: string
  patient_id: string
  drug_id: string
  dispensed_by: string
  prescription_note?: string
  quantity: number
  unit_price: number
  total_price: number
  dispensed_at: string
  patient?: Patient
  drug?: Drug
  dispenser?: Profile
}

export interface InventoryDispensing {
  id: string
  patient_id: string
  item_id: string
  dispensed_by: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
  dispensed_at: string
  patient?: Patient
  item?: InventoryOthers
  dispenser?: Profile
}

export interface AuditLog {
  id: string
  user_id?: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  table_name: string
  record_id?: string
  created_at: string
}
