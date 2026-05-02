import { supabase } from './supabase'
import { createSafeSearchQuery, sanitizeSearchInput } from './sanitization'
import type { Profile, Patient, Appointment, Prescription } from '@/types'

// Query Keys for React Query
export const queryKeys = {
  patients: ['patients'],
  patient: (id: string) => ['patient', id],
  appointments: ['appointments'],
  appointmentsToday: ['appointments', 'today'],
  prescriptions: ['prescriptions'],
  pendingPrescriptions: ['prescriptions', 'pending'],
  drugs: ['drugs'],
  lowStockDrugs: ['drugs', 'low-stock'],
  inventory: ['inventory'],
  payments: ['payments'],
  revenue: ['revenue'],
  users: ['users'],
  profile: ['profile'],
  stats: ['stats'],
  caseNotes: ['case-notes'],
  notifications: ['notifications'],
}

// Fetch current user profile
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Create or update profile
export async function upsertProfile(profile: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// Fetch patients with search
export async function fetchPatients(search?: string, limit = 100): Promise<Patient[]> {
  let q = supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(limit)
  if (search) {
    const safeSearchQuery = createSafeSearchQuery(search, ['first_name', 'last_name', 'patient_number', 'phone'])
    if (safeSearchQuery) {
      q = q.or(safeSearchQuery)
    }
  }
  const { data } = await q
  return data ?? []
}

// Fetch single patient
export async function fetchPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).single()
  if (error) return null
  return data
}

// Create patient
export async function createPatient(patient: Partial<Patient>): Promise<Patient> {
  const { data, error } = await supabase.from('patients').insert(patient).select().single()
  if (error) throw error
  return data
}

// Update patient
export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
  const { data, error } = await supabase.from('patients').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// Delete patient
export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) throw error
}

// Fetch appointments
export async function fetchAppointments(options: {
  date?: string
  status?: string
  doctorId?: string
  patientId?: string
} = {}): Promise<Appointment[]> {
  let q = supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name, phone)')
    .order('scheduled_at', { ascending: true })

  if (options.date) {
    const startOfDay = `${options.date}T00:00:00`
    const endOfDay = `${options.date}T23:59:59`
    q = q.gte('scheduled_at', startOfDay).lte('scheduled_at', endOfDay)
  }
  if (options.status) {
    q = q.eq('status', options.status)
  }
  if (options.doctorId) {
    q = q.eq('doctor_id', options.doctorId)
  }
  if (options.patientId) {
    q = q.eq('patient_id', options.patientId)
  }

  const { data } = await q
  return data ?? []
}

// Create appointment
export async function createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase.from('appointments').insert(appointment).select().single()
  if (error) throw error
  return data
}

// Update appointment
export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
  const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// Fetch prescriptions
export async function fetchPrescriptions(options: {
  status?: string
  patientId?: string
  doctorId?: string
} = {}): Promise<Prescription[]> {
  let q = supabase
    .from('prescriptions')
    .select('*, patient:patients(first_name, last_name), doctor:profiles(full_name)')
    .order('created_at', { ascending: false })

  if (options.status) {
    q = q.eq('status', options.status)
  }
  if (options.patientId) {
    q = q.eq('patient_id', options.patientId)
  }
  if (options.doctorId) {
    q = q.eq('doctor_id', options.doctorId)
  }

  const { data } = await q
  return data ?? []
}

// Create prescription
export async function createPrescription(prescription: Partial<Prescription>): Promise<Prescription> {
  const { data, error } = await supabase.from('prescriptions').insert(prescription).select().single()
  if (error) throw error
  return data
}

// Update prescription status
export async function updatePrescriptionStatus(id: string, status: string): Promise<Prescription> {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Fetch dashboard stats
export async function fetchDashboardStats(role: string): Promise<Record<string, number>> {
  const today = new Date().toISOString().split('T')[0]
  const startOfDay = `${today}T00:00:00`
  const endOfDay = `${today}T23:59:59`

  const [
    { count: patientsCount },
    { count: appointmentsToday },
    { count: pendingRx },
    { count: lowStock },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('scheduled_at', startOfDay).lte('scheduled_at', endOfDay),
    supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('pharmacy_drugs').select('*', { count: 'exact', head: true }).lt('quantity_in_stock', 10),
  ])

  return {
    patients: patientsCount ?? 0,
    appointmentsToday: appointmentsToday ?? 0,
    pendingRx: pendingRx ?? 0,
    lowStock: lowStock ?? 0,
  }
}

// Fetch all staff profiles
export async function fetchStaff(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('full_name')
  return data ?? []
}

// Update staff role
export async function updateStaffRole(id: string, role: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Toggle staff active status
export async function toggleStaffStatus(id: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Send notification
export async function sendNotification(
  userId: string,
  notification: {
    type: string
    title: string
    message: string
    link?: string
  }
): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    ...notification,
    read: false,
  })
}