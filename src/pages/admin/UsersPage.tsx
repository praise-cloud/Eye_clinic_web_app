import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck, UserX, Trash2, AlertTriangle, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
import { notify } from '@/store/notificationStore'
import { getAutoSecureErrorMessage } from '@/lib/errors'
import { logError } from '@/lib/logger'
import type { Profile } from '@/types'

const schema = z.object({
    full_name: z.string().min(2, 'Required'),
    email: z.string().email('Valid email required'),
    password: z.string().optional(),
    role: z.enum(['doctor', 'frontdesk', 'admin', 'manager']),
    phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function UsersPage() {
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
    const [editTarget, setEditTarget] = useState<Profile | null>(null)
    const [error, setError] = useState('')

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
            return (data ?? []) as Profile[]
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    })

    useEffect(() => {
        if (editTarget) {
            setValue('full_name', editTarget.full_name || '')
            setValue('role', editTarget.role)
            setValue('phone', editTarget.phone || '')
        }
    }, [editTarget, setValue])

const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
        if (!data.password) throw new Error('Password is required')

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                role: data.role,
                phone: data.phone,
            }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create account')
        return result
    },
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['staff'] })
        setOpen(false); reset(); setError('')
        notify({ type: 'patient', title: 'Staff Account Created', message: 'A new staff account has been created.', link: '/admin/users' })
    },
    onError: (e: Error) => {
        logError('Create staff error', e)
        setError(getAutoSecureErrorMessage(e))
    },
})

const toggleActive = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff'] })
            notify({ type: 'system', title: 'Staff Status Updated', message: 'Staff member status has been changed.' })
        },
        onError: (e: Error) => {
            logError('Toggle staff error', e)
            notify({ type: 'system', title: 'Error', message: getAutoSecureErrorMessage(e) })
        },
    })

const updateMutation = useMutation({
        mutationFn: async (data: FormData & { id: string }) => {
            const { id, password, ...profileData } = data
            const updates: Partial<Profile> = {
                full_name: profileData.full_name,
                role: profileData.role as Profile['role'],
                phone: profileData.phone || undefined,
            }
            const { error } = await supabase.from('profiles').update(updates).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff'] })
            setEditTarget(null); reset(); setError('')
            notify({ type: 'system', title: 'Staff Updated', message: 'Staff account has been updated.' })
        },
        onError: (e: Error) => {
            logError('Update staff error', e)
            setError(getAutoSecureErrorMessage(e))
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            // First delete from Supabase Auth (this will cascade to delete the profile)
            const { error: authError } = await supabase.auth.admin.deleteUser(userId)
            if (authError) {
                // If admin deletion fails, try to just deactivate as fallback
                const { error: profileError } = await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
                if (profileError) throw profileError
                throw new Error('User deactivated but could not be permanently deleted. Check service role permissions.')
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['staff'] })
            setDeleteTarget(null)
            notify({ type: 'system', title: 'Account Deleted', message: 'Staff account has been permanently deleted.' })
        },
        onError: (e: Error) => {
            logError('Delete staff error', e)
            setError(getAutoSecureErrorMessage(e))
        },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground900">Staff Management</h1>
                    <p className="text-sm text-foreground500">{users.length} staff members</p>
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
                        <div key={u.id} className="bg-card border border-border shadow-card hover:shadow-card-md transition-all p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${getRoleAccent(u.role)}, ${getRoleAccent(u.role)}cc)` }}>
                                    {getInitials(u.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-foreground900">{u.full_name}</p>
                                        <span className={`text-xs capitalize px-2 py-0.5 rounded-full font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                                        <Badge variant={u.is_active ? 'success' : 'destructive'} className="text-xs">{u.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                    <p className="text-xs text-foreground400 mt-0.5">{u.phone || 'No phone'} · Joined {formatDate(u.created_at)}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button variant="ghost" size="sm"
                                        className="h-8 text-xs rounded-lg gap-1 text-blue-600 hover:bg-blue-50"
                                        onClick={() => { reset(); setError(''); setEditTarget(u) }}>
                                        <Pencil className="w-3.5 h-3.5" /><span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                        className={`h-8 text-xs rounded-lg gap-1 ${u.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                        onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                                        {u.is_active
                                            ? <><UserX className="w-3.5 h-3.5" /><span className="hidden sm:inline">Disable</span></>
                                            : <><UserCheck className="w-3.5 h-3.5" /><span className="hidden sm:inline">Enable</span></>}
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                        className="h-8 text-xs rounded-lg gap-1 text-red-500 hover:bg-red-50"
                                        onClick={() => setDeleteTarget(u)}>
                                        <Trash2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Delete</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && <div className="text-center py-16 text-foreground400">No staff members yet</div>}
                </div>
            )}

            {/* Create Modal */}
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
                                <SelectTrigger label="Role *" error={errors.role?.message}>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin/Accounts</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="frontdesk">Frontdesk</SelectItem>
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

            {/* Edit Modal */}
            <Modal open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null) }}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle>Edit Staff Member</ModalTitle>
                        <ModalDescription>Update staff account details</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>}
                        <form id="edit-form" onSubmit={handleSubmit(d => editTarget && updateMutation.mutate({ ...d, id: editTarget.id }))} className="space-y-4">
                            <Input label="Full Name *" error={errors.full_name?.message} {...register('full_name')} />
                            <Select onValueChange={v => setValue('role', v as any)}>
                                <SelectTrigger label="Role *">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin/Accounts</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="frontdesk">Frontdesk</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Phone (optional)" {...register('phone')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                        <Button type="submit" form="edit-form" loading={updateMutation.isPending}>Save Changes</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />Delete Account
                        </ModalTitle>
                        <ModalDescription>
                            This will permanently delete <strong>{deleteTarget?.full_name}</strong>'s account and remove all their data from the system. This action cannot be undone.
                        </ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" loading={deleteMutation.isPending}
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                            Delete Permanently
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}