import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface ClinicSettings {
    clinic_name: string
    clinic_email: string
    clinic_phone: string
    clinic_address: string
}

interface SettingsStore {
    settings: ClinicSettings | null
    isLoading: boolean
    fetchSettings: () => Promise<void>
}

export const useClinicStore = create<SettingsStore>((set) => ({
    settings: null,
    isLoading: false,

    fetchSettings: async () => {
        set({ isLoading: true })
        try {
            const { data } = await supabase.from('settings').select('key, value')
            
            const settingsMap: Record<string, string> = {}
            ;(data ?? []).forEach(row => {
                settingsMap[row.key] = row.value
            })

            set({
                settings: {
                    clinic_name: settingsMap.clinic_name || 'Eye Clinic',
                    clinic_email: settingsMap.clinic_email || '',
                    clinic_phone: settingsMap.clinic_phone || '',
                    clinic_address: settingsMap.clinic_address || '',
                },
                isLoading: false,
            })
        } catch {
            set({ isLoading: false })
        }
    },
}))

export function getClinicSettings() {
    return useClinicStore.getState().settings
}