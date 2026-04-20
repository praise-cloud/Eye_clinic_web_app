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
  blood_group?: string
  allergies?: string
  subscription_type?: 'none' | 'basic' | 'standard' | 'premium'
  subscription_start?: string
  subscription_end?: string
  registered_by?: string
  created_at: string
  updated_at: string
}

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
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: Profile
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  case_note_id?: string
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

export interface Drug {
  id: string
  name: string
  generic_name?: string
  category?: string
  unit: string
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  supplier?: string
  expiry_date?: string
  created_at: string
  updated_at: string
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

export interface GlassesInventory {
  id: string
  frame_name: string
  frame_brand?: string
  frame_code?: string
  color?: string
  material?: string
  gender?: 'male' | 'female' | 'unisex'
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  created_at: string
  updated_at: string
}

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

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface OutreachLog {
  id: string
  patient_id: string
  sent_by: string
  channel: 'sms' | 'email' | 'whatsapp'
  message_template?: string
  message_body?: string
  status: 'sent' | 'failed' | 'delivered'
  sent_at: string
  patient?: Patient
}

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
