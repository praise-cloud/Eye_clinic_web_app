import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    setIsLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    setIsLoading(false)

    if (authError) {
      const msg = authError.message?.toLowerCase() || ''
      if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('credentials') || msg.includes('could not find') || msg.includes('not found')) {
        setError('Incorrect email or password.')
      } else if (msg.includes('not confirmed')) {
        setError('Email not confirmed. Contact admin.')
      } else {
        setError('Login failed. Please try again.')
      }
      return
    }

    if (authData.user) {
      // FIX: Set user in store BEFORE navigating to ensure auth state is ready
      useAuthStore.getState().setUser(authData.user)
      
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profile) useAuthStore.getState().setProfile(profile)

      const role = profile?.role || authData.user.user_metadata?.role || 'frontdesk'
      navigate(`/${role}`, { replace: true })
    }
  }

  return (
        <div className="min-h-screen flex bg-background">
            {/* Left branding panel — desktop only */}
            <div className="hidden lg:flex flex-col justify-between w-[420px] bg-slate-900 dark:bg-slate-950 p-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center overflow-hidden shadow-lg">
                        <img src="/icons/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-lg">{clinicName}</p>
                        <p className="text-slate-400 text-sm">Eye Clinic</p>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute -top-20 -left-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl -z-10" />
                    <h2 className="text-3xl font-bold text-white leading-tight mb-4">
                        Complete clinic<br />management<br />in one place.
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Patients, appointments, prescriptions, pharmacy, and finances — all in one platform.
                    </p>
                </div>
                <div className="space-y-3">
                    {['Patient records & history', 'Real-time appointments', 'Drug & glasses inventory', 'Financial reports'].map(f => (
                        <div key={f} className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="text-slate-400 text-sm">{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500 mb-4 overflow-hidden shadow-lg">
                            <img src="/icons/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">{clinicName} Eye Clinic</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
                    </div>

                    {successMessage && (
                        <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@clinic.com"
                            error={errors.email?.message}
                            autoComplete="email"
                            disabled={isLoading}
                            {...register('email')}
                        />
                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                error={errors.password?.message}
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-7 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Create Account
                        </Link>
                    </p>

                    <p className="mt-8 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} {clinicName} Eye Clinic. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}

function EyeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`${className} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
