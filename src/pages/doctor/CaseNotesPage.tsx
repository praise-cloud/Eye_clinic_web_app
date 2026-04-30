import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, Search, Trash2, Eye, ChevronDown, ChevronUp, Upload, X, File, Stethoscope, Calendar, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { PatientSearchField } from '@/components/patients/PatientSearchField'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate } from '@/lib/utils'
import { encryptText, decryptText } from '@/lib/crypto'
import type { CaseNote } from '@/types'
import { notify } from '@/store/notificationStore'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    visiting_date: z.string().optional(),
    chief_complaint: z.string().min(1, 'Required'),
    history: z.string().optional(),
    ophthalmoscopy_notes: z.string().optional(),
    previous_rx: z.string().optional(),
    externals: z.string().optional(),
    unaided_dist_re: z.string().optional(),
    unaided_dist_le: z.string().optional(),
    unaided_near_re: z.string().optional(),
    unaided_near_le: z.string().optional(),
    aided_dist_re: z.string().optional(),
    aided_dist_le: z.string().optional(),
    aided_near_re: z.string().optional(),
    aided_near_le: z.string().optional(),
    objective_re_va: z.string().optional(),
    objective_le_va: z.string().optional(),
    subjective_re_add: z.string().optional(),
    subjective_re_va: z.string().optional(),
    subjective_le_add: z.string().optional(),
    subjective_le_va: z.string().optional(),
    ret: z.boolean().optional(),
    autoref: z.boolean().optional(),
    tonometry_re: z.string().optional(),
    tonometry_le: z.string().optional(),
    tonometry_time: z.string().optional(),
    diagnosis: z.string().optional(),
    recommendation: z.string().optional(),
    final_rx_od: z.string().optional(),
    final_rx_os: z.string().optional(),
    lens_type: z.string().optional(),
    next_visiting_date: z.string().optional(),
    outstanding_bill: z.string().optional(),
    treatment_plan: z.string().optional(),
    follow_up_date: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function EyePair({ label, reName, leName, register }: { label: string; reName: keyof FormData; leName: keyof FormData; register: any }) {
    return (
        <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <div className="grid grid-cols-2 gap-2">
                <Input label="RE (OD)" {...register(reName)} />
                <Input label="LE (OS)" {...register(leName)} />
            </div>
        </div>
    )
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
    return (
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            <Icon className="w-4 h-4 text-primary" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</p>
        </div>
    )
}

function NoteCard({ note, onDelete }: { note: CaseNote; onDelete: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false)
    const [decrypted, setDecrypted] = useState<Record<string, string>>({})
    const [decrypting, setDecrypting] = useState(false)
    const [showPdf, setShowPdf] = useState(false)

    const encryptedFields = ['history', 'ophthalmoscopy_notes', 'externals', 'diagnosis', 'recommendation'] as const

    const handleExpand = async () => {
        if (!expanded && note.is_encrypted && Object.keys(decrypted).length === 0) {
            setDecrypting(true)
            const result: Record<string, string> = {}
            for (const field of encryptedFields) {
                const value = note[field as keyof CaseNote]
                if (value && typeof value === 'string') result[field] = await decryptText(value)
            }
            setDecrypted(result)
            setDecrypting(false)
        }
        setExpanded(!expanded)
    }

    const d = (field: string, raw?: string) => decrypted[field] || raw

    return (
        <div className="bg-card rounded-2xl border border-border shadow-card hover:shadow-card-md transition-all">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/patients/${note.patient_id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                                {(note.patient as any)?.first_name} {(note.patient as any)?.last_name}
                            </Link>
                            <span className="text-xs text-slate-400 font-mono">{(note.patient as any)?.patient_number}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1 font-medium">{note.chief_complaint}</p>
                        {note.visiting_date && <p className="text-xs text-slate-400 mt-0.5">Visit: {formatDate(note.visiting_date)}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-slate-400">{formatDate(note.created_at)}</span>
                        <button onClick={handleExpand} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => onDelete(note.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {decrypting ? (
                            <div className="flex items-center gap-2 text-xs text-slate-400"><Eye className="w-3.5 h-3.5" />Decrypting...</div>
                        ) : (
                            <>
                                {d('history', note.history) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Case History</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('history', note.history)}</p></div>
                                )}
                                {d('ophthalmoscopy_notes', note.ophthalmoscopy_notes) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ophthalmoscopy</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('ophthalmoscopy_notes', note.ophthalmoscopy_notes)}</p></div>
                                )}
                                {note.previous_rx && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Previous Rx</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{note.previous_rx}</p></div>
                                )}
                                {d('externals', note.externals) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Externals</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('externals', note.externals)}</p></div>
                                )}

                                {(note.unaided_dist_re || note.unaided_dist_le || note.unaided_near_re || note.unaided_near_le || note.aided_dist_re || note.aided_dist_le || note.aided_near_re || note.aided_near_le) && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Visual Acuity</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {note.unaided_dist_re && <p><span className="text-slate-400">Unaided Dist RE:</span> {note.unaided_dist_re}</p>}
                                            {note.unaided_dist_le && <p><span className="text-slate-400">Unaided Dist LE:</span> {note.unaided_dist_le}</p>}
                                            {note.unaided_near_re && <p><span className="text-slate-400">Unaided Near RE:</span> {note.unaided_near_re}</p>}
                                            {note.unaided_near_le && <p><span className="text-slate-400">Unaided Near LE:</span> {note.unaided_near_le}</p>}
                                            {note.aided_dist_re && <p><span className="text-slate-400">Aided Dist RE:</span> {note.aided_dist_re}</p>}
                                            {note.aided_dist_le && <p><span className="text-slate-400">Aided Dist LE:</span> {note.aided_dist_le}</p>}
                                            {note.aided_near_re && <p><span className="text-slate-400">Aided Near RE:</span> {note.aided_near_re}</p>}
                                            {note.aided_near_le && <p><span className="text-slate-400">Aided Near LE:</span> {note.aided_near_le}</p>}
                                        </div>
                                    </div>
                                )}

                                {(note.objective_re_va || note.objective_le_va) && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Objective Refraction</p>
                                        <div className="grid grid-cols-2 gap-x-4 text-sm">
                                            {note.objective_re_va && <p><span className="text-slate-400">RE VA:</span> {note.objective_re_va}</p>}
                                            {note.objective_le_va && <p><span className="text-slate-400">LE VA:</span> {note.objective_le_va}</p>}
                                        </div>
                                    </div>
                                )}
                                {(note.subjective_re_add || note.subjective_re_va || note.subjective_le_add || note.subjective_le_va) && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subjective Refraction</p>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {note.subjective_re_add && <p><span className="text-slate-400">RE Add:</span> {note.subjective_re_add}</p>}
                                            {note.subjective_re_va && <p><span className="text-slate-400">RE VA:</span> {note.subjective_re_va}</p>}
                                            {note.subjective_le_add && <p><span className="text-slate-400">LE Add:</span> {note.subjective_le_add}</p>}
                                            {note.subjective_le_va && <p><span className="text-slate-400">LE VA:</span> {note.subjective_le_va}</p>}
                                        </div>
                                    </div>
                                )}

                                {(note.ret || note.autoref) && (
                                    <div className="flex gap-4 text-sm">
                                        {note.ret && <span className="inline-flex items-center gap-1 text-slate-600"><Stethoscope className="w-3.5 h-3.5" />RET</span>}
                                        {note.autoref && <span className="inline-flex items-center gap-1 text-slate-600"><Stethoscope className="w-3.5 h-3.5" />Autoref</span>}
                                    </div>
                                )}

                                {(note.tonometry_re || note.tonometry_le || note.tonometry_time) && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tonometry</p>
                                        <div className="grid grid-cols-3 gap-x-4 text-sm">
                                            {note.tonometry_re && <p><span className="text-slate-400">RE:</span> {note.tonometry_re}</p>}
                                            {note.tonometry_le && <p><span className="text-slate-400">LE:</span> {note.tonometry_le}</p>}
                                            {note.tonometry_time && <p><span className="text-slate-400">Time:</span> {note.tonometry_time}</p>}
                                        </div>
                                    </div>
                                )}

                                {d('diagnosis', note.diagnosis) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Diagnosis</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('diagnosis', note.diagnosis)}</p></div>
                                )}
                                {d('recommendation', note.recommendation) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Recommendation</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('recommendation', note.recommendation)}</p></div>
                                )}
                                {note.treatment_plan && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Treatment Plan</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{note.treatment_plan}</p></div>
                                )}

                                {(note.final_rx_od || note.final_rx_os || note.lens_type) && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Final Prescription</p>
                                        <div className="grid grid-cols-3 gap-x-4 text-sm">
                                            {note.final_rx_od && <p><span className="text-slate-400">OD:</span> {note.final_rx_od}</p>}
                                            {note.final_rx_os && <p><span className="text-slate-400">OS:</span> {note.final_rx_os}</p>}
                                            {note.lens_type && <p><span className="text-slate-400">Lens:</span> {note.lens_type}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-x-4 text-sm pt-2 border-t border-slate-50">
                                    {note.next_visiting_date && <p><span className="text-slate-400">Next Visit:</span> {formatDate(note.next_visiting_date)}</p>}
                                    {note.outstanding_bill != null && <p><span className="text-slate-400">Outstanding:</span> {note.outstanding_bill}</p>}
                                    {(note.doctor as any)?.full_name && <p><span className="text-slate-400">Doctor:</span> {(note.doctor as any)?.full_name}</p>}
                                </div>

                                {note.cvf_attachment_url && (
                                    <div className="pt-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">CVF Attachment</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setShowPdf(true)} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                                <File className="w-4 h-4" />View Document
                                            </button>
                                            <a href={note.cvf_attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                                                <Eye className="w-4 h-4" />Download
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {showPdf && note.cvf_attachment_url && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPdf(false)}>
                    <div className="bg-card shadow-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">CVF Document</h3>
                            <button onClick={() => setShowPdf(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe src={note.cvf_attachment_url} className="w-full h-full" title="CVF Document" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export function CaseNotesPage() {
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [patientDisplay, setPatientDisplay] = useState('')
    const [search, setSearch] = useState('')
    const [cvfFile, setCvfFile] = useState<File | null>(null)

    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['case-notes', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('case_notes')
                .select('*, patient:patients(first_name,last_name,patient_number,date_of_birth), doctor:profiles(full_name)')
                .eq('doctor_id', profile!.id)
                .order('created_at', { ascending: false })
            return (data ?? []) as CaseNote[]
        },
        enabled: !!profile,
    })

    const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { ret: false, autoref: false }
    })

    const uploadCvfFile = async (file: File, patientId: string): Promise<string | null> => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${patientId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('cvf-attachments').upload(fileName, file)
        if (uploadError) { console.error('CVF upload error:', uploadError); return null }
        const { data } = supabase.storage.from('cvf-attachments').getPublicUrl(fileName)
        return data.publicUrl
    }

    const buildInsertData = async (data: FormData) => {
        let cvfAttachmentUrl: string | null = null
        if (cvfFile && data.patient_id) cvfAttachmentUrl = await uploadCvfFile(cvfFile, data.patient_id)

        return {
            patient_id: data.patient_id,
            doctor_id: profile!.id,
            chief_complaint: data.chief_complaint,
            visiting_date: data.visiting_date || undefined,
            history: data.history ? await encryptText(data.history) : undefined,
            ophthalmoscopy_notes: data.ophthalmoscopy_notes ? await encryptText(data.ophthalmoscopy_notes) : undefined,
            previous_rx: data.previous_rx || undefined,
            externals: data.externals ? await encryptText(data.externals) : undefined,
            unaided_dist_re: data.unaided_dist_re || undefined,
            unaided_dist_le: data.unaided_dist_le || undefined,
            unaided_near_re: data.unaided_near_re || undefined,
            unaided_near_le: data.unaided_near_le || undefined,
            aided_dist_re: data.aided_dist_re || undefined,
            aided_dist_le: data.aided_dist_le || undefined,
            aided_near_re: data.aided_near_re || undefined,
            aided_near_le: data.aided_near_le || undefined,
            objective_re_va: data.objective_re_va || undefined,
            objective_le_va: data.objective_le_va || undefined,
            subjective_re_add: data.subjective_re_add || undefined,
            subjective_re_va: data.subjective_re_va || undefined,
            subjective_le_add: data.subjective_le_add || undefined,
            subjective_le_va: data.subjective_le_va || undefined,
            ret: data.ret || false,
            autoref: data.autoref || false,
            tonometry_re: data.tonometry_re || undefined,
            tonometry_le: data.tonometry_le || undefined,
            tonometry_time: data.tonometry_time || undefined,
            diagnosis: data.diagnosis ? await encryptText(data.diagnosis) : undefined,
            recommendation: data.recommendation ? await encryptText(data.recommendation) : undefined,
            treatment_plan: data.treatment_plan || undefined,
            next_visiting_date: data.next_visiting_date || undefined,
            outstanding_bill: data.outstanding_bill ? parseFloat(data.outstanding_bill) : undefined,
            is_encrypted: true,
            cvf_attachment_url: cvfAttachmentUrl,
        }
    }

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const insertData = await buildInsertData(data)
            await supabase.from('case_notes').insert(insertData)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['case-notes'] })
            setOpen(false)
            reset()
            setPatientDisplay('')
            setCvfFile(null)
            notify({ type: 'prescription', title: 'Case Note Saved', message: 'A new case note has been created and encrypted.', link: '/doctor/case-notes' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => { await supabase.from('case_notes').delete().eq('id', id) },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['case-notes'] }); setDeleteId(null); notify({ type: 'system', title: 'Case Note Deleted', message: 'The case note has been permanently deleted.' }) },
    })

    const filtered = notes.filter(n => {
        if (!search) return true
        const name = `${(n.patient as any)?.first_name} ${(n.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase()) || n.chief_complaint?.toLowerCase().includes(search.toLowerCase())
    })

    const handleClear = () => {
        reset()
        setPatientDisplay('')
        setCvfFile(null)
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Case Notes</h1>
                    <p className="text-sm text-slate-500">{notes.length} notes</p>
                </div>
                <Button size="sm" onClick={() => { handleClear(); setOpen(true) }} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />New Note
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Search patient or complaint..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-slate-300" /></div>
                    <p className="text-slate-500 font-medium">No case notes yet</p>
                    <Button className="mt-5 gap-1.5" size="sm" onClick={() => { handleClear(); setOpen(true) }}><Plus className="w-4 h-4" />New Note</Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(note => (<NoteCard key={note.id} note={note} onDelete={setDeleteId} />))}
                </div>
            )}

            {/* Create Modal */}
            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="lg">
                    <ModalHeader>
                        <ModalTitle>New Case Note</ModalTitle>
                        <ModalDescription>Clinical notes are encrypted before saving</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        <form id="note-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">

                            {/* Patient Information */}
                            <PatientSearchField
                                label="Patient"
                                required
                                value={patientDisplay}
                                error={errors.patient_id?.message}
                                onSelect={p => { setValue('patient_id', p.id, { shouldValidate: true }); setPatientDisplay(`${p.first_name} ${p.last_name} (${p.patient_number})`) }}
                                onClear={() => { setValue('patient_id', ''); setPatientDisplay('') }}
                            />
                            <Input label="Visiting Date" type="date" {...register('visiting_date')} />

                            {/* Case Details */}
                            <SectionHeader icon={Stethoscope} title="Case Details" />
                            <Input label="Chief Complaint *" error={errors.chief_complaint?.message} {...register('chief_complaint')} />
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Case History</label>
                                <textarea className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Patient's history..." {...register('history')} />
                            </div>

                            {/* Ophthalmoscopy / Other Examinations */}
                            <SectionHeader icon={Eye} title="Ophthalmoscopy / Other Examinations" />
                            {[
                                ['ophthalmoscopy_notes', 'Ophthalmoscopy Notes'],
                                ['previous_rx', 'Previous Prescription (Rx)'],
                                ['externals', 'External Examination']
                            ].map(([f, l]) => (
                                <div key={f} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{l}</label>
                                    <textarea className="w-full min-h-[60px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" {...register(f as any)} />
                                </div>
                            ))}

                            {/* Visual Acuity */}
                            <SectionHeader icon={Eye} title="Visual Acuity — Unaided (Without Glasses)" />
                            <EyePair label="Distance" reName="unaided_dist_re" leName="unaided_dist_le" register={register} />
                            <EyePair label="Near" reName="unaided_near_re" leName="unaided_near_le" register={register} />

                            <SectionHeader icon={Eye} title="Visual Acuity — Aided (With Glasses)" />
                            <EyePair label="Distance" reName="aided_dist_re" leName="aided_dist_le" register={register} />
                            <EyePair label="Near" reName="aided_near_re" leName="aided_near_le" register={register} />

                            <SectionHeader icon={Eye} title="Objective Refraction" />
                            <EyePair label="Objective Refraction" reName="objective_re_va" leName="objective_le_va" register={register} />

                            <SectionHeader icon={Eye} title="Subjective Refraction" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 font-medium">Right Eye (RE)</p>
                                    <Input label="Add" {...register('subjective_re_add')} />
                                    <Input label="VA" {...register('subjective_re_va')} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 font-medium">Left Eye (LE)</p>
                                    <Input label="Add" {...register('subjective_le_add')} />
                                    <Input label="VA" {...register('subjective_le_va')} />
                                </div>
                            </div>

                            <SectionHeader icon={Stethoscope} title="Additional Options" />
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" {...register('ret')} />
                                    <span className="text-sm text-slate-700">RET (Retinoscopy)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" {...register('autoref')} />
                                    <span className="text-sm text-slate-700">Autoref (Auto Refraction)</span>
                                </label>
                            </div>

                            <SectionHeader icon={Stethoscope} title="Tonometry" />
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Right Eye (RE)" placeholder="e.g. 14 mmHg" {...register('tonometry_re')} />
                                <Input label="Left Eye (LE)" placeholder="e.g. 16 mmHg" {...register('tonometry_le')} />
                                <Input label="Time" type="time" {...register('tonometry_time')} />
                            </div>

                            <SectionHeader icon={Stethoscope} title="Diagnosis & Recommendation" />
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Diagnosis</label>
                                <textarea className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Clinical diagnosis..." {...register('diagnosis')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Recommendation</label>
                                <textarea className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Treatment recommendations..." {...register('recommendation')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Treatment Plan</label>
                                <textarea className="w-full min-h-[60px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Plan..." {...register('treatment_plan')} />
                            </div>

                            <SectionHeader icon={FileText} title="Final Prescription" />
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Final Rx OD" placeholder="e.g. -2.00 / -0.50 x 180" {...register('final_rx_od')} />
                                <Input label="Final Rx OS" placeholder="e.g. -1.50 / -0.75 x 90" {...register('final_rx_os')} />
                                <Input label="Lens Type" placeholder="e.g. Single Vision" {...register('lens_type')} />
                            </div>

                            <SectionHeader icon={Calendar} title="Other Information" />
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Next Visiting Date" type="date" {...register('next_visiting_date')} />
                                <Input label="Doctor's Name" value={profile?.full_name || ''} disabled />
                                <Input label="Outstanding Bill" type="number" placeholder="0.00" {...register('outstanding_bill')} />
                            </div>

                            {/* CVF Attachment */}
                            <SectionHeader icon={File} title="CVF Document Attachment (optional)" />
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                {cvfFile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <File className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700">{cvfFile.name}</span>
                                        <button type="button" onClick={() => setCvfFile(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm text-slate-500">Click to upload CVF document</p>
                                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, PDF (max 10MB)</p>
                                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCvfFile(file) }} />
                                    </label>
                                )}
                            </div>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <div className="flex flex-wrap gap-2 w-full">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button variant="outline" onClick={handleClear}><X className="w-3.5 h-3.5 mr-1" />Clear</Button>
                            <Button variant="outline" onClick={() => navigate('/doctor/prescriptions')}><FileText className="w-3.5 h-3.5 mr-1" />Prescriptions</Button>
                            <Button type="submit" form="note-form" loading={isSubmitting || createMutation.isPending}><Plus className="w-3.5 h-3.5 mr-1" />Save Note</Button>
                        </div>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle>Delete Case Note</ModalTitle>
                        <ModalDescription>This action cannot be undone. The note will be permanently deleted.</ModalDescription>
                    </ModalHeader>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete Note</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
