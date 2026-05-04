import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types'

interface AuthState {
  user: Profile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  profile: Profile | null
  setUser: (user: Profile) => void
  setToken: (token: string) => void
  clearAuth: () => void
  updateUser: (updates: Partial<Profile>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      get profile() { return get().user },

      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => set({ token }),
      
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      
      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
