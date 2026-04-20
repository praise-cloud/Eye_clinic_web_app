export type UserRole = 'admin' | 'doctor' | 'assistant' | 'accountant'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  gender?: string
  phone_number?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  dob?: string
  gender?: string
  contact?: string
  email?: string
  address?: string
  reason_for_visit?: string
  client_type?: string
  marital_status?: string
  intake_date?: string
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  patient_id: string
  visit_date: string
  visit_type: string
  reason?: string
  payment_status: 'pending' | 'paid' | 'partial'
  amount_paid: number
  linked_prescription_id?: string
  created_by?: string
  created_at: string
}

export interface Test {
  id: string
  patient_id: string
  visit_id?: string
  test_date: string
  eye?: 'left' | 'right' | 'both'
  machine_type?: string
  raw_data?: Record<string, unknown>
  report_status: 'pending' | 'completed' | 'reviewed'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Prescription {
  id: string
  patient_id: string
  visit_id?: string
  doctor_id: string
  prescription_type: 'drug' | 'glasses'
  drug_id?: string
  quantity: number
  instructions?: string
  glasses_details?: Record<string, unknown>
  status: 'pending' | 'dispensed' | 'cancelled' | 'pending_return'
  created_at: string
  updated_at: string
  patient?: Patient
  drug?: PharmacyDrug
  doctor?: User
}

export interface PharmacyDrug {
  id: string
  drug_code: string
  drug_name: string
  drug_form?: string
  strength?: string
  pack_size: number
  unit_price: number
  current_quantity: number
  minimum_quantity: number
  status: 'active' | 'inactive'
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface PharmacyDispensation {
  id: string
  prescription_id?: string
  drug_id: string
  patient_id: string
  visit_id?: string
  quantity: number
  unit_price: number
  total_amount: number
  user_id: string
  notes?: string
  created_at: string
  drug?: PharmacyDrug
  patient?: Patient
}

export interface InventoryItem {
  id: string
  item_code: string
  item_name: string
  category: string
  description?: string
  manufacturer?: string
  model_number?: string
  serial_number?: string
  current_quantity: number
  minimum_quantity: number
  maximum_quantity: number
  unit_of_measure: string
  unit_cost: number
  supplier_name?: string
  supplier_contact?: string
  purchase_date?: string
  expiry_date?: string
  location?: string
  status: 'active' | 'inactive'
  last_updated_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Revenue {
  id: string
  source: string
  source_id?: string
  amount: number
  currency: string
  user_id?: string
  patient_id?: string
  visit_id?: string
  collected_by?: string
  description?: string
  timestamp: string
  patient?: Patient
}

export interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  attachment?: string
  timestamp: string
  status: 'read' | 'unread'
  sender?: User
  receiver?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  related_id?: string
  status: 'read' | 'unread'
  created_at: string
}

export interface CaseNote {
  id: string
  patient_id: string
  visit_id?: string
  test_id?: string
  doctor_id: string
  chief_complaint?: string
  visual_acuity_od?: string
  visual_acuity_os?: string
  intraocular_pressure_od?: string
  intraocular_pressure_os?: string
  cvf_analysis_od?: string
  cvf_analysis_os?: string
  diagnosis?: string
  recommendation?: string
  next_appointment?: string
  status: 'draft' | 'signed'
  signed_off_by?: string
  signed_off_at?: string
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: User
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  reason?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: User
}

export interface DashboardStats {
  totalPatients: number
  totalTests: number
  todayRevenue: number
  monthlyRevenue: number
  pendingPrescriptions: number
  newClientsToday: number
  totalAppointmentsToday: number
  lowStockItems: number
}

export interface ActivityLog {
  id: string
  user_id: string
  action_type: string
  entity_type: string
  entity_id?: string
  description: string
  ip_address?: string
  timestamp: string
  user?: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}