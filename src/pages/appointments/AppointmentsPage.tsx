import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Search, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Appointment, Patient, Profile } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    doctor_id: z.string().min(1, 'Select a doctor'),
    scheduled_at: z.string().min(1, 'Required'),
    appointment_type: z.enum(['checkup', 'follow_up', 'new_consultation', 'glasses_fitting', 'emergency']),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'destructive' | 'info'; dot: string }> = {
    pending: { label: 'Pending', variant: 'warning', dot: 'bg-amber-400' },
    confirmed: { label: 'Confirmed', variant: 'info', dot: 'bg-blue-400' },
    arrived: { label: 'Arrived', variant: 'success', dot: 'bg-emerald-400' },
    in_progress: { label: 'In Progress', variant: 'default', dot: 'bg-slate-400' },
    completed: { label: 'Completed', variant: 'success', dot: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', variant: 'destructive', dot: 'bg-red-400' },
    no_show: { label: 'No Show', variant: 'destructive', dot: 'bg-red-400' },
}

export function AppointmentsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [open, setOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['appointments', statusFilter],
        queryFn: async () => {
            let q = supabase.from('appointments')
                .select('*, patient:patients(first_name,last_name,patient_number), doctor:profiles(full_name)')
                .order('scheduled_at', { ascending: false }).limit(100)
            if (statusFilter !== 'all') q = q.eq('status', statusFilter)
            if (profile?.role === 'doctor') q = q.eq('doctor_id', profile.id)
            const { data } = await q
            return (data ?? []) as Appointment[]
        },
    })

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-search', patientSearch],
        queryFn: async () => {
            const { data } = await supabase.from('patients').select('id,first_name,last_name,patient_number').ilike('first_name', `%${patientSearch}%`).limit(8)
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
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setOpen(false); reset(); setPatientSearch('') },
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
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Appointments</h1>
                    <p className="text-sm text-slate-500">{filtered.length} appointments</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setPatientSearch(''); setOpen(true) }} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Book Appointment</span><span className="sm:hidden">Book</span>
                </Button>
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 sm:w-40 rounded-xl border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No appointments found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(apt => {
                        const cfg = statusConfig[apt.status] ?? statusConfig.pending
                        return (
                            <div key={apt.id} className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-md transition-all p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {(apt.patient as any)?.first_name?.[0]}{(apt.patient as any)?.last_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <Link to={`/patients/${apt.patient_id}`} className="font-semibold text-sm text-slate-900 hover:text-primary transition-colors">
                                                {(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}
                                            </Link>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(apt.scheduled_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                            <span className="capitalize">{apt.appointment_type.replace('_', ' ')}</span>
                                            <span className="hidden sm:inline">Dr. {(apt.doctor as any)?.full_name}</span>
                                        </div>
                                        <div className="flex gap-1.5 mt-2.5">
                                            {apt.status === 'pending' && <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => updateStatus.mutate({ id: apt.id, status: 'confirmed' })}>Confirm</Button>}
                                            {apt.status === 'confirmed' && <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => updateStatus.mutate({ id: apt.id, status: 'arrived' })}>Mark Arrived</Button>}
                                            {apt.status === 'arrived' && <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => updateStatus.mutate({ id: apt.id, status: 'in_progress' })}><CheckCircle2 className="w-3 h-3" />Begin</Button>}
                                            {apt.status === 'in_progress' && <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => updateStatus.mutate({ id: apt.id, status: 'completed' })}><CheckCircle2 className="w-3 h-3" />Complete</Button>}
                                            {['pending', 'confirmed'].includes(apt.status) && <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => updateStatus.mutate({ id: apt.id, status: 'cancelled' })}><XCircle className="w-3 h-3" /></Button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="md">
                    <ModalHeader>
                        <ModalTitle>Book Appointment</ModalTitle>
                        <ModalDescription>Schedule a new patient appointment</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        <form id="apt-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient</label>
                                <input className="mt-1.5 w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search patient name..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                {patients.length > 0 && (
                                    <div className="mt-1 border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-40 overflow-y-auto bg-white shadow-card-md">
                                        {patients.map(p => (
                                            <button key={p.id} type="button" className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                                onClick={() => { setValue('patient_id', p.id); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                <span className="font-medium">{p.first_name} {p.last_name}</span>
                                                <span className="text-slate-400 ml-2 font-mono text-xs">{p.patient_number}</span>
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
                                <SelectTrigger label="Appointment Type" error={errors.appointment_type?.message}><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checkup">Routine Checkup</SelectItem>
                                    <SelectItem value="follow_up">Follow Up</SelectItem>
                                    <SelectItem value="new_consultation">New Consultation</SelectItem>
                                    <SelectItem value="glasses_fitting">Glasses Fitting</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Notes (optional)" {...register('notes')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="apt-form" loading={isSubmitting || createMutation.isPending}>Book Appointment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
