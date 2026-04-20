import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { supabase } from './services/supabase'
import { useAuthStore } from './stores/authStore'
import api from './services/api'
import type { User } from './types'

// Restore session on page load before rendering
async function initAuth() {
  const { setLoading, login, logout } = useAuthStore.getState()
  setLoading(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      localStorage.setItem('access_token', session.access_token)
      localStorage.setItem('refresh_token', session.refresh_token)
      const response = await api.get('/api/auth/me')
      login(response.data.user as User)
    } else {
      logout()
    }
  } catch {
    logout()
  } finally {
    setLoading(false)
  }
}

initAuth().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
