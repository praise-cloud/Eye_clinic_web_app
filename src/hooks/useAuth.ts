import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { signOut } = useAuthStore()

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    try {
      await supabase.auth.signOut()
      signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      signOut()
      window.location.href = '/login'
    }
  }

  return { login, logout }
}
