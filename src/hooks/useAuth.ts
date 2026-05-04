import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
  const { signOut } = useAuthStore()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    console.log('Logout initiated')
    try {
      await supabase.auth.signOut({ scope: 'global' })
      console.log('Supabase signOut complete')
    } catch (error) {
      console.error('Supabase signOut error:', error)
    } finally {
      signOut()
      console.log('Store cleared, redirecting...')
      window.location.href = '/login'
    }
  }

  return { login, logout }
}
