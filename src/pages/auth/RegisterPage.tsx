import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['doctor', 'frontdesk', 'admin', 'manager'], { required_error: 'Select a role' }),
})
type FormData = z.infer<typeof schema>

// Use Supabase admin API via service key — works from any device
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [role, setRole] = useState<string>('')

  // Check if service key is available
  if (!SERVICE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500 mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">Configuration Error</h1>
          <p className="text-muted-foreground text-sm mt-2">Registration is not available. Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      // Call Supabase Admin API directly — no backend server needed
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: { full_name: data.full_name, role: data.role },
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.msg || result.error_description || 'Registration failed')
      navigate('/login', { state: { message: 'Account created! You can now sign in.' } })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setServerError('This email is already registered. Try signing in instead.')
      } else {
        setServerError(msg)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">KORENE Eye Clinic</h1>
          <p className="text-muted-foreground text-sm mt-1">Create your staff account</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-base font-semibold mb-5">Register</h2>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="Dr. John Adeyemi" error={errors.full_name?.message} {...register('full_name')} />
            <Input label="Email Address" type="email" placeholder="you@clinic.com" error={errors.email?.message} {...register('email')} />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-7 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Select value={role} onValueChange={val => { setRole(val); setValue('role', val as FormData['role'], { shouldValidate: true }) }}>
              <SelectTrigger label="Role" error={errors.role?.message}><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin/Accounts</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="frontdesk">Frontdesk</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full h-10" loading={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
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
