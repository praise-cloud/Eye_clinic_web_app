import type { Patient } from './patient'
import type { Profile } from './profile'

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  requested_by?: string
  scheduled_at: string
  appointment_type: 'checkup' | 'follow_up' | 'new_consultation' | 'glasses_fitting' | 'emergency'
  status: 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: Profile
}
