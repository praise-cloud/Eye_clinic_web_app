import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'
import type { Profile } from '@/types'
import { Input } from '@/components/ui/input'
import { buildFallbackProfile, getRoleDashboardPath, normalizeUserRole } from '@/lib/auth'
import { getAutoSecureErrorMessage } from '@/lib/errors'
import { logError } from '@/lib/logger'
import { loginRateLimiter, formatTimeRemaining } from '@/lib/rateLimit'

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

    // Check for existing session on mount and redirect if already logged in
    useEffect(() => {
        let mounted = true
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error
                if (session?.user && mounted) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()

                    const resolvedProfile = (profile as Profile) ?? buildFallbackProfile(session.user)
                    const { setProfile, setUser } = useAuthStore.getState()
                    setProfile(resolvedProfile)
                    setUser(session.user)
                    
                    const role = resolvedProfile.role
                    if (role === 'doctor') navigate('/doctor', { replace: true })
                    else if (role === 'frontdesk') navigate('/frontdesk', { replace: true })
                    else if (role === 'admin') navigate('/admin', { replace: true })
                    else if (role === 'manager') navigate('/manager', { replace: true })
                }
            } catch (err) {
                logError('Session check failed, clearing auth state', err)
                await supabase.auth.signOut()
                useAuthStore.getState().setUser(null)
                useAuthStore.getState().setProfile(null)
            }
        }
        checkSession()
        return () => { mounted = false }
    }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const onSubmit = async (data: FormData) => {
        setError('')
        setIsLoading(true)

        try {
            // Check rate limiting first
            const rateLimitResult = loginRateLimiter.checkLimit(data.email)
            if (!rateLimitResult.allowed) {
                const timeRemaining = formatTimeRemaining(rateLimitResult.resetTime! - Date.now())
                setError(`Too many login attempts. Please wait ${timeRemaining} before trying again.`)
                setIsLoading(false)
                return
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (authError) {
                setError(getAutoSecureErrorMessage(authError))
                setIsLoading(false)
                return
            }

            // Login successful - fetch profile and navigate
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user!.id)
                    .single()

                if (profileError && profileError.code === 'PGRST116') {
                    // No profile found, use fallback
                    console.warn('[Login] No profile found, using fallback')
                    const resolvedProfile = buildFallbackProfile(authData.user!)
                    useAuthStore.getState().setProfile(resolvedProfile)
                    const role = normalizeUserRole(resolvedProfile.role || authData.user!.user_metadata?.role)
                    console.log('[Login] Navigating to:', `/${role}`)
                    navigate(getRoleDashboardPath(role), { replace: true })
                } else if (profileError) {
                    throw profileError
                } else {
                    const resolvedProfile = (profileData as Profile | null) ?? buildFallbackProfile(authData.user!)
                    useAuthStore.getState().setProfile(resolvedProfile)
                    const role = normalizeUserRole(resolvedProfile.role || authData.user!.user_metadata?.role)
                    console.log('[Login] Navigating to role dashboard:', role)
                    navigate(getRoleDashboardPath(role), { replace: true })
                }
            } catch (profileErr: any) {
                console.error('[Login] Profile error, using fallback:', profileErr)
                const resolvedProfile = buildFallbackProfile(authData.user!)
                useAuthStore.getState().setProfile(resolvedProfile)
                const role = normalizeUserRole(resolvedProfile.role || authData.user!.user_metadata?.role)
                navigate(getRoleDashboardPath(role), { replace: true })
            } finally {
                setIsLoading(false)
            }
        } catch (err: any) {
            console.error('[Login] Catch error:', err)
            setError(getAutoSecureErrorMessage(err))
            setIsLoading(false)
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
                    <div
                        className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm"
                        role="alert"
                        aria-live="polite"
                    >
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div
                        id="login-error"
                        className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm"
                        role="alert"
                        aria-live="assertive"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@clinic.com"
                        error={errors.email?.message}
                        autoComplete="email"
                        disabled={isLoading}
                        required
                        aria-required="true"
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
                            required
                            aria-required="true"
                            pattern=".*"
                            {...register('password')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-7 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            disabled={isLoading}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-describedby={error ? 'login-error' : undefined}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                <span>Signing in...</span>
                            </>
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
