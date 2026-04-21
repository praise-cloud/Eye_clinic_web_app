import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Glasses } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { notify } from '@/store/notificationStore'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate } from '@/lib/utils'
import type { Prescription, Patient } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Required'),
    re_sphere: z.string().optional(), re_cylinder: z.string().optional(), re_axis: z.string().optional(), re_add: z.string().optional(), re_va: z.string().optional(),
    le_sphere: z.string().optional(), le_cylinder: z.string().optional(), le_axis: z.string().optional(), le_add: z.string().optional(), le_va: z.string().optional(),
    pd: z.string().optional(),
    lens_type: z.enum(['single_vision', 'bifocal', 'progressive', 'reading']).optional(),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function PrescriptionsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')

    const { data: prescriptions = [], isLoading } = useQuery({
        queryKey: ['prescriptions', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('prescriptions').select('*, patient:patients(first_name,last_name,patient_number)').eq('doctor_id', profile!.id).order('created_at', { ascending: false })
            return (data ?? []) as Prescription[]
        },
        enabled: !!profile,
    })

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-search', patientSearch],
        queryFn: async () => {
            const { data } = await supabase.from('patients').select('id,first_name,last_name,patient_number').ilike('first_name', `%${patientSearch}%`).limit(10)
            return (data ?? []) as Patient[]
        },
        enabled: patientSearch.length > 1,
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const toNum = (v?: string) => v ? parseFloat(v) : undefined
            await supabase.from('prescriptions').insert({
                patient_id: data.patient_id, doctor_id: profile!.id,
                re_sphere: toNum(data.re_sphere), re_cylinder: toNum(data.re_cylinder), re_axis: toNum(data.re_axis), re_add: toNum(data.re_add), re_va: data.re_va,
                le_sphere: toNum(data.le_sphere), le_cylinder: toNum(data.le_cylinder), le_axis: toNum(data.le_axis), le_add: toNum(data.le_add), le_va: data.le_va,
                pd: toNum(data.pd), lens_type: data.lens_type, notes: data.notes,
            })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['prescriptions'] })
            setDrawerOpen(false)
            reset()
            notify({ type: 'prescription', title: 'Prescription Created', message: 'A new glasses prescription has been saved.', link: '/doctor/prescriptions' })
        },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">Prescriptions</h1><p className="text-sm text-muted-foreground">{prescriptions.length} prescriptions</p></div>
                <Button size="sm" onClick={() => { reset(); setDrawerOpen(true) }}><Plus className="w-4 h-4" />New Prescription</Button>
            </div>

            {isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}</div> : prescriptions.length === 0 ? (
                <Card><CardContent className="text-center py-16"><Glasses className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No prescriptions yet</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {prescriptions.map(rx => (
                        <Card key={rx.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <Link to={`/patients/${rx.patient_id}`} className="font-medium text-sm hover:text-primary">
                                            {(rx.patient as any)?.first_name} {(rx.patient as any)?.last_name}
                                        </Link>
                                        <p className="text-xs text-muted-foreground">{(rx.patient as any)?.patient_number} · {formatDate(rx.created_at)}</p>
                                    </div>
                                    {rx.lens_type && <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{rx.lens_type.replace('_', ' ')}</span>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-muted-foreground">RIGHT EYE (OD)</p>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-muted-foreground">{l}</p>)}
                                            <p>{rx.re_sphere ?? '—'}</p><p>{rx.re_cylinder ?? '—'}</p><p>{rx.re_axis ?? '—'}</p><p>{rx.re_add ?? '—'}</p>
                                        </div>
                                        {rx.re_va && <p>VA: {rx.re_va}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-muted-foreground">LEFT EYE (OS)</p>
                                        <div className="grid grid-cols-4 gap-1 text-center">
                                            {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-muted-foreground">{l}</p>)}
                                            <p>{rx.le_sphere ?? '—'}</p><p>{rx.le_cylinder ?? '—'}</p><p>{rx.le_axis ?? '—'}</p><p>{rx.le_add ?? '—'}</p>
                                        </div>
                                        {rx.le_va && <p>VA: {rx.le_va}</p>}
                                    </div>
                                </div>
                                {rx.pd && <p className="text-xs mt-2 text-muted-foreground">PD: {rx.pd}mm</p>}
                                {rx.notes && <p className="text-xs mt-1 text-muted-foreground">{rx.notes}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={drawerOpen} onOpenChange={setDrawerOpen}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>New Glasses Prescription</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="rx-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Patient</label>
                                <input className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                {patients.length > 0 && (
                                    <div className="mt-1 border rounded-md divide-y max-h-40 overflow-y-auto">
                                        {patients.map(p => (
                                            <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                                onClick={() => { setValue('patient_id', p.id); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                {p.first_name} {p.last_name} · {p.patient_number}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id.message}</p>}
                            </div>

                            {/* Right Eye */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2">Right Eye (OD)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[['re_sphere', 'Sph'], ['re_cylinder', 'Cyl'], ['re_axis', 'Axis'], ['re_add', 'Add'], ['re_va', 'VA']].map(([f, l]) => (
                                        <Input key={f} label={l} placeholder="—" {...register(f as any)} />
                                    ))}
                                </div>
                            </div>

                            {/* Left Eye */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2">Left Eye (OS)</p>
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
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="rx-form" loading={isSubmitting || createMutation.isPending}>Save Prescription</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
