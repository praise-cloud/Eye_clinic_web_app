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
import { buildFallbackProfile, getRoleDashboardPath } from '@/lib/auth'

  const schema = z.object({
    full_name: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
    phone: z.string().optional(),
    role: z.enum(['frontdesk', 'doctor', 'admin', 'manager'], {
      required_error: 'Please select a role' }),
  })
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const clinicName = useClinicStore(s => s.settings?.clinic_name || 'Eye Clinic')
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    const redirectAuthenticatedUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted || !session?.user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // No profile found, use fallback
        const resolvedProfile = buildFallbackProfile(session.user)
        useAuthStore.getState().setUser(session.user)
        useAuthStore.getState().setProfile(resolvedProfile)
        navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })
        return
      } else if (profileError) {
        throw profileError
      }

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
    defaultValues: { role: 'frontdesk' },
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setIsLoading(true)

    try {
        // Use the backend which calls admin.createUser() — no confirmation email sent
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role,
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            if (result.error?.includes('already registered') || result.error?.includes('already been registered')) {
                setServerError('This email is already registered. Try signing in instead.')
            } else {
                setServerError(result.error || 'Registration failed.')
            }
            return
        }

        // Account created — now sign in immediately (admin.createUser auto-confirms)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        })

        if (signInError || !authData.user) {
            // Account created but sign-in failed — redirect to login
            navigate('/login', { state: { message: 'Account created! Please sign in.' } })
            return
        }

        useAuthStore.getState().setUser(authData.user)

        // Profile fetch after successful registration
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single()

            if (profileError && profileError.code === 'PGRST116') {
                // No profile found, use fallback
                console.warn('No profile found after registration, using fallback')
                const resolvedProfile = buildFallbackProfile(authData.user)
                useAuthStore.getState().setProfile(resolvedProfile)
                navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })
                return
            } else if (profileError) {
                throw profileError
            }

            const resolvedProfile = (profile as Profile | null) ?? buildFallbackProfile(authData.user)
            useAuthStore.getState().setProfile(resolvedProfile)
            navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })
        } catch (profileErr) {
            console.error('Profile fetch error after registration:', profileErr)
            // Continue with fallback profile
            const resolvedProfile = buildFallbackProfile(authData.user)
            useAuthStore.getState().setProfile(resolvedProfile)
            navigate(getRoleDashboardPath(resolvedProfile.role), { replace: true })
        }

    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Registration failed.'
        setServerError(msg)
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
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+234 800 000 0000"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Select onValueChange={(value) => setValue('role', value as any)} defaultValue="frontdesk">
              <SelectTrigger label="Role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontdesk">Frontdesk</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
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
