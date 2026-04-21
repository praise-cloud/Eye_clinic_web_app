import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const location = useLocation()
  const successMessage = (location.state as any)?.message
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    setIsLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
      if (authError) throw authError
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.includes('Invalid login') ? 'Incorrect email or password.' : msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-slate-900 p-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">KORENE</p>
            <p className="text-slate-400 text-xs">Eye Clinic</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Complete clinic<br />management<br />in one place.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Patients, appointments, prescriptions, pharmacy, and finances — all managed from a single platform built for eye clinics.
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

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500 mb-3">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">KORENE Eye Clinic</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{successMessage}</div>
          )}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email Address" type="email" placeholder="you@clinic.com" error={errors.email?.message} autoComplete="email" {...register('email')} />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" error={errors.password?.message} autoComplete="current-password" {...register('password')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-11 text-sm font-semibold" loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New staff member?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Create account</Link>
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} KORENE Eye Clinic. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
