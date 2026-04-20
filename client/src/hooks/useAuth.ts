import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../services/supabase'
import api from '../services/api'
import type { User } from '../types'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout, setLoading } = useAuthStore()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!data.user) throw new Error('No user data')

      const response = await api.get('/api/auth/me')
      const userData = response.data.user as User

      localStorage.setItem('access_token', data.session?.access_token || '')
      localStorage.setItem('refresh_token', data.session?.refresh_token || '')
      storeLogin(userData)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [navigate, storeLogin, setLoading])

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, role: string) => {
    setError(null)
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName, role } }
      })
      if (authError) throw authError
      if (!data.user) throw new Error('Registration failed')
      navigate('/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [navigate, setLoading])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      storeLogout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }, [navigate, storeLogout, setLoading])

  return { user, isAuthenticated, isLoading, error, login, register, logout }
}
