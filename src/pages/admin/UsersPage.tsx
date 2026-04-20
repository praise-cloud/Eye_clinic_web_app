import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCog } from 'lucide-react'
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
import { getRoleColor, formatDate } from '@/lib/utils'
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
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
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
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">User Management</h1><p className="text-sm text-muted-foreground">{users.length} staff members</p></div>
                <Button size="sm" onClick={() => { reset(); setError(''); setDrawerOpen(true) }}><Plus className="w-4 h-4" />Add Staff</Button>
            </div>

            {isLoading ? <Skeleton className="h-64" /> : (
                <Card><CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/30">
                            <tr>{['Name', 'Role', 'Phone', 'Status', 'Joined', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{u.full_name[0]}</div>
                                            <div><p className="font-medium">{u.full_name}</p></div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleColor(u.role)}`}>{u.role}</span></td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.phone || '—'}</td>
                                    <td className="px-4 py-3"><Badge variant={u.is_active ? 'success' : 'destructive'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}>
                                            {u.is_active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && <p className="text-center py-10 text-muted-foreground">No staff members</p>}
                </CardContent></Card>
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
