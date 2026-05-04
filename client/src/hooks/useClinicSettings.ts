import { create } from 'zustand'

interface ClinicSettings {
  clinic_name?: string
  clinic_address?: string
  clinic_phone?: string
  clinic_email?: string
  working_hours?: string
  appointment_duration?: number
  max_appointments_per_day?: number
  enable_sms_reminders?: boolean
  auto_logout_minutes?: number
}

interface SettingsState {
  settings: ClinicSettings | null
  loading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSettings: (settings: Partial<ClinicSettings>) => Promise<void>
}

export const useClinicStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null })
    
    try {
      // For now, use default settings
      // In a real app, this would fetch from the API
      const defaultSettings: ClinicSettings = {
        clinic_name: 'KORENE Eye Clinic',
        clinic_address: '123 Medical Center Drive',
        clinic_phone: '+1 (555) 123-4567',
        clinic_email: 'info@koreneeyeclinic.com',
        working_hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-2PM',
        appointment_duration: 30,
        max_appointments_per_day: 20,
        enable_sms_reminders: true,
        auto_logout_minutes: 60
      }
      
      set({ settings: defaultSettings, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch settings', loading: false })
    }
  },

  updateSettings: async (updates) => {
    const { settings } = get()
    if (!settings) return

    try {
      // For now, just update local state
      // In a real app, this would update via API
      const updatedSettings = { ...settings, ...updates }
      set({ settings: updatedSettings })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' })
    }
  }
}))
