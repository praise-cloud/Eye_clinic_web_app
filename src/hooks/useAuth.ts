import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      signOut()
      navigate('/login', { replace: true })
    }
  }, [signOut, navigate])

  return { login, logout }
}
