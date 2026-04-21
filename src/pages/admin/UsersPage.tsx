import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRoleColor, getRoleAccent, getInitials, formatDate } from '@/lib/utils'
import type { Profile } from '@/types'
import { notify } from '@/store/notificationStore'

const schema = z.object({
    full_name: z.string().min(2, 'Required'),
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Min 8 characters'),
    role: z.enum(['doctor', 'assistant', 'accountant']),
    phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function UsersPage() {
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            return (data ?? []) as Profile[]
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
            const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY
            const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
                body: JSON.stringify({ email: data.email, password: data.password, email_confirm: true, user_metadata: { full_name: data.full_name, role: data.role } }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.msg || result.error_description || 'Failed to create user')
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff'] })
            setOpen(false)
            reset()
            setError('')
            notify({ type: 'patient', title: 'Staff Account Created', message: 'A new staff account has been created successfully.', link: '/admin/users' })
        },
        onError: (e: Error) => setError(e.message),
    })

    const toggleActive = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase.from('profiles').update({ is_active }).eq('id', id)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff'] })
            notify({ type: 'system', title: 'Staff Status Updated', message: 'Staff member status has been changed.' })
        },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Staff Management</h1>
                    <p className="text-sm text-slate-500">{users.length} staff members</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setError(''); setOpen(true) }} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Add Staff</span><span className="sm:hidden">Add</span>
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : (
                <div className="space-y-2">
                    {users.map(u => (
                        <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-md transition-all p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${getRoleAccent(u.role)}, ${getRoleAccent(u.role)}cc)` }}>
                                    {getInitials(u.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-slate-900">{u.full_name}</p>
                                        <span className={`text-xs capitalize px-2 py-0.5 rounded-full font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                                        <Badge variant={u.is_active ? 'success' : 'destructive'} className="text-xs">{u.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">{u.phone || 'No phone'} · Joined {formatDate(u.created_at)}</p>
                                </div>
                                <Button
                                    variant="ghost" size="sm"
                                    className={`h-8 text-xs rounded-lg flex-shrink-0 gap-1.5 ${u.is_active ? 'text-red-500 hover:bg-red-50 hover:text-red-600' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                    onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                                    {u.is_active ? <><UserX className="w-3.5 h-3.5" /><span className="hidden sm:inline">Deactivate</span></> : <><UserCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Activate</span></>}
                                </Button>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && (
                        <div className="text-center py-16 text-slate-400">No staff members yet</div>
                    )}
                </div>
            )}

            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle>Add Staff Member</ModalTitle>
                        <ModalDescription>Create a new staff account</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>}
                        <form id="user-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <Input label="Full Name *" error={errors.full_name?.message} {...register('full_name')} />
                            <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
                            <Input label="Password *" type="password" error={errors.password?.message} {...register('password')} />
                            <Select onValueChange={v => setValue('role', v as any)}>
                                <SelectTrigger label="Role *" error={errors.role?.message}><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="assistant">Assistant</SelectItem>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Phone (optional)" {...register('phone')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="user-form" loading={isSubmitting || createMutation.isPending}>Create Account</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
