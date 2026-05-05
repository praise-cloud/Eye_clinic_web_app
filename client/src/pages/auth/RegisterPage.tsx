import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthService from '../../services/authService'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'frontdesk' as 'frontdesk' | 'admin' | 'doctor' | 'manager'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await AuthService.register(formData)

      if (response.success) {
        navigate('/login', { 
          state: { message: 'Registration successful! Please sign in with your new account.' }
        })
      } else {
        setError(response.error || 'Registration failed')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      {/* Large circular graphic element - Supabase inspired */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '384px',
        height: '384px',
        background: 'linear-gradient(to bottom right, #9333ea, #2563eb)',
        borderRadius: '50%',
        filter: 'blur(96px)',
        opacity: 0.2,
        transform: 'translate(-50%, -50%)'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '80px',
        right: 0,
        width: '256px',
        height: '256px',
        background: 'linear-gradient(to bottom right, #16a34a, #2563eb)',
        borderRadius: '50%',
        filter: 'blur(64px)',
        opacity: 0.1
      }}></div>
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '448px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(to bottom right, #9333ea, #2563eb)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ fontSize: '18px', color: '#9ca3af' }}>Join the Eye Clinic team</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(55, 65, 81, 1)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{
                backgroundColor: 'rgba(127, 29, 29, 0.5)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="full_name" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Full Name
              </label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 1)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0 16px',
                  fontSize: '16px'
                }}
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 1)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0 16px',
                  fontSize: '16px'
                }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 1)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0 16px',
                  fontSize: '16px'
                }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="role" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#d1d5db',
                marginBottom: '8px'
              }}>
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'frontdesk' | 'admin' | 'doctor' | 'manager' })}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(55, 65, 81, 1)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '0 16px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
                required
                disabled={loading}
              >
                <option value="frontdesk" style={{ backgroundColor: '#1f2937' }}>Front Desk</option>
                <option value="doctor" style={{ backgroundColor: '#1f2937' }}>Doctor</option>
                <option value="admin" style={{ backgroundColor: '#1f2937' }}>Admin</option>
                <option value="manager" style={{ backgroundColor: '#1f2937' }}>Manager</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                background: 'linear-gradient(to right, #9333ea, #2563eb)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              loading={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/login" style={{
              color: '#a78bfa',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}>
              Already have an account? <span style={{ textDecoration: 'underline' }}>Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
