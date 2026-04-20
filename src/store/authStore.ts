import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
    user: User | null
    profile: Profile | null
    isLoading: boolean
    isAuthenticated: boolean
    setUser: (user: User | null) => void
    setProfile: (profile: Profile | null) => void
    setLoading: (loading: boolean) => void
    signOut: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            profile: null,
            isLoading: true,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setLoading: (isLoading) => set({ isLoading }),
            signOut: () => set({ user: null, profile: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, profile: state.profile, isAuthenticated: state.isAuthenticated }),
        }
    )
)
