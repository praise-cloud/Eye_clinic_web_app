import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['doctor', 'frontdesk', 'admin', 'manager'], { required_error: 'Select a role' }),
})
type FormData = z.infer<typeof schema>

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Helper to map invalid roles to valid ones
const mapRole = (role: string | undefined): string => {
  const validRoles = ['doctor', 'frontdesk', 'admin', 'manager']
  if (!role) return 'frontdesk'
  return validRoles.includes(role) ? role : 'frontdesk'
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const clinicName = useClinicStore(s => s.settings?.clinic_name || 'Eye Clinic')
  const [serverError, setServerError] = useState('')
  const [role, setRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    setIsLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
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

      // Auto sign in after registration
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (signInError) throw signInError

      // FIX: Set user and profile in store BEFORE navigating
      if (authData?.user) {
        useAuthStore.getState().setUser(authData.user)

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (profile) {
          useAuthStore.getState().setProfile(profile as any)
        }
      }

      // Use setTimeout to ensure state is fully propagated before navigation
      setTimeout(() => {
        const role = mapRole(data.role)
        navigate(`/${role}`, { replace: true })
      }, 50)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.'
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setServerError('This email is already registered. Try signing in instead.')
      } else {
        setServerError(msg)
      }
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
