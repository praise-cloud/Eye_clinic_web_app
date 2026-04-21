import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, FileText, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate } from '@/lib/utils'
import { encryptText, decryptText } from '@/lib/crypto'
import type { CaseNote, Patient } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    chief_complaint: z.string().min(1, 'Required'),
    history: z.string().optional(),
    examination: z.string().optional(),
    diagnosis: z.string().optional(),
    treatment_plan: z.string().optional(),
    follow_up_date: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function CaseNotesPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')
    const [search, setSearch] = useState('')

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['case-notes', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('case_notes').select('*, patient:patients(first_name,last_name,patient_number)').eq('doctor_id', profile!.id).order('created_at', { ascending: false })
            return (data ?? []) as CaseNote[]
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
            const encrypted = {
                ...data,
                history: data.history ? await encryptText(data.history) : undefined,
                examination: data.examination ? await encryptText(data.examination) : undefined,
                diagnosis: data.diagnosis ? await encryptText(data.diagnosis) : undefined,
                doctor_id: profile!.id,
                is_encrypted: true,
            }
            await supabase.from('case_notes').insert(encrypted)
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['case-notes'] }); setDrawerOpen(false); reset() },
    })

    const filtered = notes.filter(n => {
        if (!search) return true
        const name = `${(n.patient as any)?.first_name} ${(n.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase()) || n.chief_complaint?.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">Case Notes</h1><p className="text-sm text-muted-foreground">{notes.length} notes</p></div>
                <Button size="sm" onClick={() => { reset(); setDrawerOpen(true) }}><Plus className="w-4 h-4" />New Note</Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient or complaint..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div> : filtered.length === 0 ? (
                <Card><CardContent className="text-center py-16"><FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No case notes yet</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {filtered.map(note => (
                        <Card key={note.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link to={`/patients/${note.patient_id}`} className="font-medium text-sm hover:text-primary">
                                                {(note.patient as any)?.first_name} {(note.patient as any)?.last_name}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">· {(note.patient as any)?.patient_number}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{note.chief_complaint}</p>
                                        {note.treatment_plan && <p className="text-xs text-muted-foreground mt-1">Treatment: {note.treatment_plan}</p>}
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(note.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={drawerOpen} onOpenChange={setDrawerOpen}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>New Case Note</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="note-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
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
                            <Input label="Chief Complaint *" error={errors.chief_complaint?.message} {...register('chief_complaint')} />
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide">History</label>
                                <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('history')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide">Examination Findings</label>
                                <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('examination')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide">Diagnosis</label>
                                <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('diagnosis')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide">Treatment Plan</label>
                                <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('treatment_plan')} />
                            </div>
                            <Input label="Follow-up Date" type="date" {...register('follow_up_date')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="note-form" loading={isSubmitting || createMutation.isPending}>Save Note</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
