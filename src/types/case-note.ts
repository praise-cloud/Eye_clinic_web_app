import type { Patient } from './patient'
import type { Profile } from './profile'

export interface CaseNote {
  id: string
  patient_id: string
  doctor_id: string
  appointment_id?: string
  chief_complaint?: string
  history?: string
  examination?: string
  diagnosis?: string
  treatment_plan?: string
  follow_up_date?: string
  is_encrypted: boolean
  cvf_attachment_url?: string
  // Ophthalmology fields
  visiting_date?: string
  ophthalmoscopy_notes?: string
  previous_rx?: string
  externals?: string
  unaided_dist_re?: string
  unaided_dist_le?: string
  unaided_near_re?: string
  unaided_near_le?: string
  aided_dist_re?: string
  aided_dist_le?: string
  aided_near_re?: string
  aided_near_le?: string
  objective_re_va?: string
  objective_le_va?: string
  subjective_re_add?: string
  subjective_re_va?: string
  subjective_le_add?: string
  subjective_le_va?: string
  ret?: boolean
  autoref?: boolean
  tonometry_re?: string
  tonometry_le?: string
  tonometry_time?: string
  recommendation?: string
  final_rx_od?: string
  final_rx_os?: string
  lens_type?: string
  next_visiting_date?: string
  outstanding_bill?: number
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: Profile
}
