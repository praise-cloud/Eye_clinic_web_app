import type { Patient } from './patient'
import type { Profile } from './profile'

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  case_note_id?: string
  status?: 'pending' | 'dispensed'
  re_sphere?: number
  re_cylinder?: number
  re_axis?: number
  re_add?: number
  re_va?: string
  le_sphere?: number
  le_cylinder?: number
  le_axis?: number
  le_add?: number
  le_va?: string
  pd?: number
  lens_type?: 'single_vision' | 'bifocal' | 'progressive' | 'reading'
  notes?: string
  created_at: string
  patient?: Patient
  doctor?: Profile
}
