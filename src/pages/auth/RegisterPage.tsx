import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'
import type { Profile } from '@/types'
import { buildFallbackProfile, getRoleDashboardPath, normalizeUserRole } from '@/lib/auth'

  const schema = z.object({
    full_name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const clinicName = useClinicStore(s => s.settings?.clinic_name || 'Eye Clinic')
  const [serverError, setServerError] = useState('')
  const [role, setRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const redirectAuthenticatedUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted || !session?.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const resolvedProfile = (profile as Profile | null) ?? buildFallbackProfile(session.user)
      useAuthStore.getState().setUser(session.user)
      useAuthStore.getState().setProfile(resolvedProfile)
      navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })
    }

    redirectAuthenticatedUser()

    return () => {
      mounted = false
    }
  }, [navigate])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setIsLoading(true)

    try {
      // Step 1: Create confirmed user via your backend admin route (no email sent)
      // Role is forced to 'frontdesk' - only admins can create other roles
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          role: 'frontdesk', // Force frontdesk role for public registration
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Registration failed.')
      }

      // Step 2: Sign in — user is already confirmed, no email rate limits hit
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) throw new Error('Account created but sign-in failed. Please go to the login page.')
      if (!signInData.user) throw new Error('Sign-in returned no user.')

      // Step 3: Set user in store
      useAuthStore.getState().setUser(signInData.user)

      // Step 4: Fetch profile (your backend already upserted it, so it should exist)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single()

      const resolvedProfile = (profile as Profile | null) ?? buildFallbackProfile(signInData.user)
      useAuthStore.getState().setProfile(resolvedProfile)

      navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      console.error('[RegisterPage] registration failed:', err)
      if (msg.includes('auth user creation failed: database error creating new user')) {
        setServerError('Supabase auth could not create the user record. This usually means your database trigger or auth schema is broken.')
      } else if (msg.includes('profile sync failed:')) {
        setServerError(msg)
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setServerError('This email is already registered. Try signing in instead.')
      } else {
        setServerError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-4 overflow-hidden shadow-lg">
            <img src="/icons/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-xl font-bold">{clinicName} Eye Clinic</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your staff account</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-base font-semibold mb-5">Register</h2>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Dr. John Adeyemi"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@clinic.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-10" disabled={isLoading || isSubmitting}>
              {(isLoading || isSubmitting) ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
