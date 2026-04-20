import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Search, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerCloseButton } from '@/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/utils'
import type { Appointment, Patient, Profile } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    doctor_id: z.string().min(1, 'Select a doctor'),
    scheduled_at: z.string().min(1, 'Required'),
    appointment_type: z.enum(['checkup', 'follow_up', 'new_consultation', 'glasses_fitting', 'emergency']),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const statusColor: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'info'> = {
    pending: 'warning', confirmed: 'info', arrived: 'success', in_progress: 'default', completed: 'success', cancelled: 'destructive', no_show: 'destructive',
}

export function AppointmentsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['appointments', search, statusFilter],
        queryFn: async () => {
            let q = supabase.from('appointments').select('*, patient:patients(first_name,last_name,patient_number), doctor:profiles(full_name)').order('scheduled_at', { ascending: false }).limit(100)
            if (statusFilter !== 'all') q = q.eq('status', statusFilter)
            if (profile?.role === 'doctor') q = q.eq('doctor_id', profile.id)
            const { data } = await q
            return (data ?? []) as Appointment[]
        },
    })

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-search', patientSearch],
        queryFn: async () => {
            const { data } = await supabase.from('patients').select('id,first_name,last_name,patient_number').ilike('first_name', `%${patientSearch}%`).limit(10)
            return (data ?? []) as Patient[]
        },
        enabled: patientSearch.length > 1,
    })

    const { data: doctors = [] } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id,full_name').eq('role', 'doctor').eq('is_active', true)
            return (data ?? []) as Profile[]
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            await supabase.from('appointments').insert({ ...data, requested_by: profile?.id })
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setDrawerOpen(false); reset() },
    })

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await supabase.from('appointments').update({ status }).eq('id', id)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
    })

    const filtered = appointments.filter(a => {
        if (!search) return true
        const name = `${(a.patient as any)?.first_name} ${(a.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase())
    })

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h1 className="text-xl font-bold">Appointments</h1><p className="text-sm text-muted-foreground">{filtered.length} appointments</p></div>
                <Button size="sm" onClick={() => { reset(); setDrawerOpen(true) }}><Plus className="w-4 h-4" />Book Appointment</Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="text-center py-16"><Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No appointments found</p></CardContent></Card>
            ) : (
                <Card><CardContent className="p-0">
                    <div className="divide-y">
                        {filtered.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {(apt.patient as any)?.first_name?.[0]}{(apt.patient as any)?.last_name?.[0]}
                                    </div>
                                    <div>
                                        <Link to={`/patients/${apt.patient_id}`} className="text-sm font-medium hover:text-primary">
                                            {(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(apt.scheduled_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                                            <span>·</span>
                                            <span className="capitalize">{apt.appointment_type.replace('_', ' ')}</span>
                                            <span>·</span>
                                            <span>Dr. {(apt.doctor as any)?.full_name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusColor[apt.status] ?? 'default'}>{apt.status.replace('_', ' ')}</Badge>
                                    {apt.status === 'pending' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: apt.id, status: 'confirmed' })}>Confirm</Button>
                                    )}
                                    {apt.status === 'confirmed' && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: apt.id, status: 'arrived' })}>Arrived</Button>
                                    )}
                                    {apt.status === 'arrived' && (
                                        <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: apt.id, status: 'in_progress' })}>Begin</Button>
                                    )}
                                    {apt.status === 'in_progress' && (
                                        <Button size="sm" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: apt.id, status: 'completed' })}>Complete</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            )}

            {/* Book Appointment Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader><DrawerTitle>Book Appointment</DrawerTitle><DrawerCloseButton /></DrawerHeader>
                    <DrawerBody>
                        <form id="apt-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Search Patient</label>
                                <input className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Type patient name..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                {patients.length > 0 && (
                                    <div className="mt-1 border rounded-md divide-y max-h-40 overflow-y-auto">
                                        {patients.map(p => (
                                            <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                                onClick={() => { setValue('patient_id', p.id); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                {p.first_name} {p.last_name} <span className="text-muted-foreground">· {p.patient_number}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id.message}</p>}
                            </div>
                            <Select onValueChange={v => setValue('doctor_id', v)}>
                                <SelectTrigger label="Doctor" error={errors.doctor_id?.message}><SelectValue placeholder="Select doctor" /></SelectTrigger>
                                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input label="Date & Time" type="datetime-local" error={errors.scheduled_at?.message} {...register('scheduled_at')} />
                            <Select onValueChange={v => setValue('appointment_type', v as any)}>
                                <SelectTrigger label="Type" error={errors.appointment_type?.message}><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checkup">Checkup</SelectItem>
                                    <SelectItem value="follow_up">Follow Up</SelectItem>
                                    <SelectItem value="new_consultation">New Consultation</SelectItem>
                                    <SelectItem value="glasses_fitting">Glasses Fitting</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Notes (optional)" {...register('notes')} />
                        </form>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="apt-form" loading={isSubmitting || createMutation.isPending}>Book Appointment</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
