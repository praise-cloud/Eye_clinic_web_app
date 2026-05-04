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
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Welcome to {clinicName}</h1>
            <p className="mt-2 text-muted-foreground">Sign in to your account</p>
          </div>

          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="form-section">
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <Link to="/register" className="text-primary hover:text-primary/80 text-sm transition-colors">
              Don't have an account? Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
