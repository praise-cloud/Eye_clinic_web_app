import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthService from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { buildFallbackProfile, getRoleDashboardPath, normalizeUserRole } from '@/lib/auth'
import { getAutoSecureErrorMessage } from '@/lib/errors'
import { logError } from '@/lib/logger'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const successMessage = (location.state as any)?.message
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const clinicName = useClinicStore(s => s.settings?.clinic_name || 'Eye Clinic')
  const { setUser, clearAuth } = useAuthStore()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await AuthService.verifyToken()
        if (response.success && response.user) {
          setUser(response.user)
          navigate(getRoleDashboardPath(response.user), { replace: true })
        }
      } catch (error) {
        // Clear invalid session
        clearAuth()
      }
    }
    
    checkAuth()
  }, [navigate, setUser, clearAuth])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await AuthService.login(data.email, data.password)
      
      if (response.success) {
        setUser(response.user)
        navigate(getRoleDashboardPath(response.user), { replace: true })
      } else {
        setError(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(getAutoSecureErrorMessage(error))
    } finally {
      setIsLoading(false)
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>Welcome to {clinicName}</h2>
          <p style={{ fontSize: '18px', color: '#9ca3af' }}>Sign in to your account</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(55, 65, 81, 1)',
          borderRadius: '16px',
          padding: '32px'
        }}>
            {successMessage && (
              <div style={{
                backgroundColor: 'rgba(20, 83, 45, 0.5)',
                border: '1px solid rgba(34, 197, 94, 0.5)',
                color: '#86efac',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {successMessage}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                  {...form.register('email')}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {form.formState.errors.email.message}
                  </p>
                )}
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
                <div style={{ position: 'relative' }}>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      height: '48px',
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      border: '1px solid rgba(55, 65, 81, 1)',
                      borderRadius: '8px',
                      color: 'white',
                      padding: '0 48px 0 16px',
                      fontSize: '16px'
                    }}
                    {...form.register('password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: '4px'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

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

              <Button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(to right, #9333ea, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
                loading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link to="/register" style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s'
              }}>
                Don't have an account? <span style={{ textDecoration: 'underline' }}>Sign up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
  )
}
