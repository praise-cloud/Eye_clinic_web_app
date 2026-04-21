import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerCloseButton } from '@/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getRoleColor, getRoleAccent, getInitials, formatDate } from '@/lib/utils'
import type { Profile } from '@/types'

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
    const [drawerOpen, setDrawerOpen] = useState(false)
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
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); setDrawerOpen(false); reset(); setError('') },
        onError: (e: Error) => setError(e.message),
    })

    const toggleActive = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            await supabase.from('profiles').update({ is_active }).eq('id', id)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold">User Management</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{users.length} staff members</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setError(''); setDrawerOpen(true) }}>
                    <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Staff</span><span className="sm:hidden">Add</span>
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
                <div className="space-y-2">
                    {users.map(u => (
                        <Card key={u.id}>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ backgroundColor: getRoleAccent(u.role) }}>
                                        {getInitials(u.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium truncate">{u.full_name}</p>
                                            <span className={`text-xs capitalize px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(u.role)}`}>{u.role}</span>
                                            <Badge variant={u.is_active ? 'success' : 'destructive'} className="text-xs">{u.is_active ? 'Active' : 'Inactive'}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{u.phone || 'No phone'} · Joined {formatDate(u.created_at)}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs flex-shrink-0"
                                        onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                                        {u.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {users.length === 0 && <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No staff members</CardContent></Card>}
                </div>
            )}

            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader><DrawerTitle>Add Staff Member</DrawerTitle><DrawerCloseButton /></DrawerHeader>
                    <DrawerBody>
                        {error && <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
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
                            <Input label="Phone" {...register('phone')} />
                        </form>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="user-form" loading={isSubmitting || createMutation.isPending}>Create Account</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
