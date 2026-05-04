// User/Profile types
export type { UserRole } from './profile'
export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'doctor' | 'frontdesk'
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Patient types
export interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  phone?: string
  email?: string
  address?: string
  occupation?: string
  next_of_kin_name?: string
  next_of_kin_phone?: string
  allergies?: string
  registered_by?: string
  created_at: string
  updated_at: string
}

// Appointment types
export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  appointment_type: 'checkup' | 'follow_up' | 'new_consultation' | 'glasses_fitting' | 'emergency'
  status: 'pending' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  reminder_sent: boolean
  requested_by?: string
  created_at: string
  updated_at: string
  // Joined data
  patients?: Patient
  profiles?: Profile
}

// Prescription types
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
  lens_type?: string
  notes?: string
  status: 'pending' | 'dispensed'
  created_at: string
  updated_at: string
  // Joined data
  patients?: Patient
  profiles?: Profile
}

// Payment types
export interface Payment {
  id: string
  receipt_number: string
  patient_id: string
  payment_type: 'consultation' | 'drug' | 'glasses_deposit' | 'glasses_balance' | 'subscription' | 'other'
  amount: number
  payment_method?: 'cash' | 'card' | 'mobile_money' | 'bank_transfer'
  notes?: string
  received_by?: string
  paid_at: string
  created_at: string
  updated_at: string
  // Joined data
  patients?: Patient
}

// Drug types
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
  batch_number?: string
  storage_location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Glasses types
export interface GlassesInventory {
  id: string
  frame_name: string
  frame_brand?: string
  frame_code?: string
  color?: string
  material?: string
  gender?: 'male' | 'female' | 'unisex'
  frame_type?: string
  size?: string
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  supplier?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Other inventory types
export interface InventoryOther {
  id: string
  name: string
  category?: string
  description?: string
  unit: string
  quantity: number
  reorder_level: number
  purchase_price?: number
  selling_price: number
  supplier?: string
  storage_location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Form types
export interface UserFormData {
  email: string
  password?: string
  full_name: string
  role: Profile['role']
  phone?: string
}

export interface PatientFormData {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: Patient['gender']
  phone?: string
  email?: string
  address?: string
  occupation?: string
  next_of_kin_name?: string
  next_of_kin_phone?: string
  allergies?: string
}

export interface AppointmentFormData {
  patient_id: string
  doctor_id: string
  scheduled_at: string
  appointment_type: Appointment['appointment_type']
  notes?: string
}

export interface PrescriptionFormData {
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
  lens_type?: string
  notes?: string
}

export interface PaymentFormData {
  patient_id: string
  payment_type: Payment['payment_type']
  amount: number
  payment_method?: Payment['payment_method']
  notes?: string
}

// Dashboard stats types
export interface DashboardStats {
  totalPatients: number
  todayAppointments: number
  completedToday: number
  dailyRevenue: number
  revenueByCategory: Record<string, number>
}

// Low stock types
export interface LowStockItem {
  drugs: Drug[]
  glasses: GlassesInventory[]
  others: InventoryOther[]
  total: number
}

// Message types
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string
  attachment_type?: 'image' | 'document'
  attachment_url?: string
  attachment_name?: string
  message_type: 'text' | 'system' | 'notification'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  reply_to_id?: string
  created_at: string
  updated_at: string
}

// Notification types
export interface AppNotification {
  id: string
  type: 'system' | 'patient' | 'appointment' | 'prescription' | 'payment' | 'low_stock' | 'dispensing' | 'glasses'
  title: string
  message: string
  user_id: string
  is_read: boolean
  created_at: string
  link?: string
}
