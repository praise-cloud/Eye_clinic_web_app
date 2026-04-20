import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { signOut } = useAuthStore()

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Navigation is handled by onAuthStateChange in AuthProvider
  }

  async function logout() {
    await supabase.auth.signOut()
    signOut()
  }

  return { login, logout }
}
