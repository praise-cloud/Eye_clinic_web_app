import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Glasses, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSearchField } from '@/components/patients/PatientSearchField'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate } from '@/lib/utils'
import { notify } from '@/store/notificationStore'
import type { Prescription } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    doctor_id: z.string().min(1, 'Select the prescribing doctor'),
    re_sphere: z.string().optional(), re_cylinder: z.string().optional(), re_axis: z.string().optional(), re_add: z.string().optional(), re_va: z.string().optional(),
    le_sphere: z.string().optional(), le_cylinder: z.string().optional(), le_axis: z.string().optional(), le_add: z.string().optional(), le_va: z.string().optional(),
    pd: z.string().optional(),
    lens_type: z.enum(['single_vision', 'bifocal', 'progressive', 'reading']).optional(),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function GlassesPrescriptionPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [patientDisplay, setPatientDisplay] = useState('')

    const { data: prescriptions = [], isLoading } = useQuery({
        queryKey: ['prescriptions-all'],
        queryFn: async () => {
            const { data } = await supabase.from('prescriptions')
                .select('*, patient:patients(first_name,last_name,patient_number), doctor:profiles(full_name)')
                .order('created_at', { ascending: false })
            return (data ?? []) as Prescription[]
        },
        refetchInterval: 15000,
    })

    const { data: doctors = [] } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('id,full_name').eq('role', 'doctor').eq('is_active', true)
            return data ?? []
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const toNum = (v?: string) => v ? parseFloat(v) : undefined
            const { error } = await supabase.from('prescriptions').insert({
                patient_id: data.patient_id,
                doctor_id: data.doctor_id,
                status: 'pending',
                re_sphere: toNum(data.re_sphere), re_cylinder: toNum(data.re_cylinder), re_axis: toNum(data.re_axis), re_add: toNum(data.re_add), re_va: data.re_va,
                le_sphere: toNum(data.le_sphere), le_cylinder: toNum(data.le_cylinder), le_axis: toNum(data.le_axis), le_add: toNum(data.le_add), le_va: data.le_va,
                pd: toNum(data.pd), lens_type: data.lens_type, notes: data.notes,
            })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['prescriptions-all'] })
            qc.invalidateQueries({ queryKey: ['assistant-dashboard'] })
            setOpen(false); reset(); setPatientDisplay('')
            notify({ type: 'prescription', title: 'Prescription Recorded', message: 'Glasses prescription has been saved.', link: '/frontdesk/prescriptions' })
        },
    })

    const dispenseMutation = useMutation({
        mutationFn: async (rxId: string) => {
            const { error } = await supabase.from('prescriptions').update({ status: 'dispensed' }).eq('id', rxId)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['prescriptions-all'] })
            qc.invalidateQueries({ queryKey: ['assistant-dashboard'] })
            notify({ type: 'prescription', title: 'Prescription Dispensed', message: 'Prescription has been marked as dispensed.' })
        },
    })

    const rxStatusVariant: Record<string, 'warning' | 'success'> = {
        pending: 'warning',
        dispensed: 'success',
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground900">Glasses Prescriptions</h1>
                    <p className="text-sm text-foreground500">{prescriptions.length} prescriptions</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setPatientDisplay(''); setOpen(true) }} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />New Prescription
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            ) : prescriptions.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Glasses className="w-8 h-8 text-foreground300" /></div>
                    <p className="text-foreground500 font-medium">No prescriptions yet</p>
                    <Button className="mt-5 gap-1.5" size="sm" onClick={() => { reset(); setOpen(true) }}><Plus className="w-4 h-4" />New Prescription</Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {prescriptions.map(rx => (
                        <Card key={rx.id} className="hover:shadow-card-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <Link to={`/patients/${rx.patient_id}`} className="font-semibold text-sm text-foreground900 hover:text-primary transition-colors">
                                            {(rx.patient as any)?.first_name} {(rx.patient as any)?.last_name}
                                        </Link>
                                        <p className="text-xs text-foreground400 mt-0.5">
                                            {(rx.patient as any)?.patient_number} · Dr. {(rx.doctor as any)?.full_name} · {formatDate(rx.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${rx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {rx.status || 'pending'}
                                        </span>
                                        {(rx.status === 'pending' || !rx.status) && (
                                            <button onClick={() => dispenseMutation.mutate(rx.id)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Mark as Dispensed">
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground500 uppercase tracking-wide text-[10px]">Right Eye (OD)</p>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-foreground400 text-[10px]">{l}</p>)}
                                            <p>{rx.re_sphere ?? '—'}</p><p>{rx.re_cylinder ?? '—'}</p><p>{rx.re_axis ?? '—'}</p><p>{rx.re_add ?? '—'}</p>
                                        </div>
                                        {rx.re_va && <p className="text-foreground500">VA: {rx.re_va}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-foreground500 uppercase tracking-wide text-[10px]">Left Eye (OS)</p>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-foreground400 text-[10px]">{l}</p>)}
                                            <p>{rx.le_sphere ?? '—'}</p><p>{rx.le_cylinder ?? '—'}</p><p>{rx.le_axis ?? '—'}</p><p>{rx.le_add ?? '—'}</p>
                                        </div>
                                        {rx.le_va && <p className="text-foreground500">VA: {rx.le_va}</p>}
                                    </div>
                                </div>
                                {rx.pd && <p className="text-xs mt-2 text-foreground400">PD: {rx.pd}mm</p>}
                                {rx.notes && <p className="text-xs mt-1 text-foreground400">{rx.notes}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="lg">
                    <ModalHeader>
                        <ModalTitle>New Glasses Prescription</ModalTitle>
                        <ModalDescription>Record a glasses prescription for a patient</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        <form id="rx-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
                            <PatientSearchField
                                label="Patient" required
                                value={patientDisplay}
                                error={errors.patient_id?.message}
                                onSelect={p => { setValue('patient_id', p.id, { shouldValidate: true }); setPatientDisplay(`${p.first_name} ${p.last_name} (${p.patient_number})`) }}
                                onClear={() => { setValue('patient_id', ''); setPatientDisplay('') }}
                            />
                            <Select onValueChange={v => setValue('doctor_id', v)}>
                                <SelectTrigger label="Prescribing Doctor *" error={errors.doctor_id?.message}><SelectValue placeholder="Select doctor" /></SelectTrigger>
                                <SelectContent>{(doctors as any[]).map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
                            </Select>

                            <div>
                                <p className="text-xs font-semibold text-foreground600 uppercase tracking-wide mb-2">Right Eye (OD)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[['re_sphere', 'Sph'], ['re_cylinder', 'Cyl'], ['re_axis', 'Axis'], ['re_add', 'Add'], ['re_va', 'VA']].map(([f, l]) => (
                                        <Input key={f} label={l} placeholder="—" {...register(f as any)} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-foreground600 uppercase tracking-wide mb-2">Left Eye (OS)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[['le_sphere', 'Sph'], ['le_cylinder', 'Cyl'], ['le_axis', 'Axis'], ['le_add', 'Add'], ['le_va', 'VA']].map(([f, l]) => (
                                        <Input key={f} label={l} placeholder="—" {...register(f as any)} />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="PD (mm)" {...register('pd')} />
                                <Select onValueChange={v => setValue('lens_type', v as any)}>
                                    <SelectTrigger label="Lens Type"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single_vision">Single Vision</SelectItem>
                                        <SelectItem value="bifocal">Bifocal</SelectItem>
                                        <SelectItem value="progressive">Progressive</SelectItem>
                                        <SelectItem value="reading">Reading</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input label="Notes" {...register('notes')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="rx-form" loading={isSubmitting || createMutation.isPending}>Save Prescription</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
