import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FileText, Search, Trash2, Eye, ChevronDown, ChevronUp, Upload, X, File, Stethoscope, Calendar, User, DollarSign, RotateCcw, Save, Pill } from 'lucide-react'
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
import type { CaseNote, Patient } from '@/types'
import { notify } from '@/store/notificationStore'

/* ───────── Zod schema ───────── */
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
    treatment_plan: z.string().optional(),
    final_rx_od: z.string().optional(),
    final_rx_os: z.string().optional(),
    lens_type: z.string().optional(),
    next_visiting_date: z.string().optional(),
    outstanding_bill: z.string().optional(),
})
type FormData = z.infer<typeof schema>

/* ───────── helpers ───────── */
function calculateAge(dob?: string): number | null {
    if (!dob) return null
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

/* ───────── NoteCard ───────── */
const ENCRYPTED_FIELDS = ['history', 'ophthalmoscopy_notes', 'externals', 'diagnosis', 'recommendation'] as const

function NoteCard({ note, onDelete }: { note: CaseNote; onDelete: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false)
    const [decrypted, setDecrypted] = useState<Record<string, string>>({})
    const [decrypting, setDecrypting] = useState(false)
    const [showPdf, setShowPdf] = useState(false)

    const handleExpand = async () => {
        if (!expanded && note.is_encrypted && Object.keys(decrypted).length === 0) {
            setDecrypting(true)
            const result: Record<string, string> = {}
            for (const field of ENCRYPTED_FIELDS) {
                const val = note[field as keyof CaseNote]
                if (val && typeof val === 'string') result[field] = await decryptText(val)
            }
            setDecrypted(result)
            setDecrypting(false)
        }
        setExpanded(!expanded)
    }

    const d = (field: string, raw?: string | null) => decrypted[field] || raw || ''

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
                            {note.visiting_date && <span className="text-xs text-slate-400"><Calendar className="w-3 h-3 inline mr-0.5" />{formatDate(note.visiting_date)}</span>}
                        </div>
                        <p className="text-sm text-slate-600 mt-1 font-medium">{note.chief_complaint}</p>
                        {note.diagnosis && !expanded && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Dx: {note.diagnosis}</p>
                        )}
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
                                {/* Patient Info */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {note.visiting_date && <div><span className="text-slate-400">Visiting Date:</span> <span className="text-slate-700">{formatDate(note.visiting_date)}</span></div>}
                                    {note.next_visiting_date && <div><span className="text-slate-400">Next Visit:</span> <span className="text-slate-700">{formatDate(note.next_visiting_date)}</span></div>}
                                    {note.outstanding_bill !== undefined && note.outstanding_bill !== null && (
                                        <div><span className="text-slate-400">Outstanding Bill:</span> <span className="text-slate-700">{note.outstanding_bill}</span></div>
                                    )}
                                </div>

                                {/* Case Details */}
                                {(d('history', note.history)) && (
                                    <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Case History</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{d('history', note.history)}</p></div>
                                )}

                                {/* Ophthalmoscopy */}
                                {(d('ophthalmoscopy_notes', note.ophthalmoscopy_notes) || d('externals', note.externals) || note.previous_rx) && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ophthalmoscopy / Examinations</p>
                                        {note.previous_rx && <p className="text-sm text-slate-700"><span className="text-slate-400 text-xs">Previous Rx:</span> {note.previous_rx}</p>}
                                        {d('externals', note.externals) && <p className="text-sm text-slate-700"><span className="text-slate-400 text-xs">Externals:</span> {d('externals', note.externals)}</p>}
                                        {d('ophthalmoscopy_notes', note.ophthalmoscopy_notes) && <p className="text-sm text-slate-700 whitespace-pre-wrap">{d('ophthalmoscopy_notes', note.ophthalmoscopy_notes)}</p>}
                                    </div>
                                )}

                                {/* Visual Acuity */}
                                {(note.unaided_dist_re || note.unaided_dist_le || note.unaided_near_re || note.unaided_near_le ||
                                  note.aided_dist_re || note.aided_dist_le || note.aided_near_re || note.aided_near_le) && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Visual Acuity</p>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="space-y-1">
                .order('created_at', { ascending: false })
            return (data ?? []) as CaseNote[]
        },
        enabled: !!profile,
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const uploadCvfFile = async (file: File, patientId: string): Promise<string | null> => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${patientId}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from('cvf-attachments')
            .upload(fileName, file)
        if (uploadError) {
            return null
        }
        const { data } = supabase.storage.from('cvf-attachments').getPublicUrl(fileName)
        return data.publicUrl
    }

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            let cvfAttachmentUrl: string | null = null

            if (cvfFile) {
                cvfAttachmentUrl = await uploadCvfFile(cvfFile, data.patient_id)
            }

            const clinicalData = []
            if (data.va_od || data.va_os) clinicalData.push(`VA: OD ${data.va_od || '—'} | OS ${data.va_os || '—'}`)
            if (data.iop_od || data.iop_os) clinicalData.push(`IOP: OD ${data.iop_od || '—'} | OS ${data.iop_os || '—'}`)
            if (data.cvf_od || data.cvf_os) clinicalData.push(`CVF: OD ${data.cvf_od || '—'} | OS ${data.cvf_os || '—'}`)
            const examinationText = [data.examination, ...clinicalData].filter(Boolean).join('\n')
            await supabase.from('case_notes').insert({
                patient_id: data.patient_id,
                chief_complaint: data.chief_complaint,
                history: data.history ? await encryptText(data.history) : undefined,
                examination: examinationText ? await encryptText(examinationText) : undefined,
                diagnosis: data.diagnosis ? await encryptText(data.diagnosis) : undefined,
                treatment_plan: data.treatment_plan,
                follow_up_date: data.follow_up_date || undefined,
                doctor_id: profile!.id,
                is_encrypted: true,
                cvf_attachment_url: cvfAttachmentUrl,
            })
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
        mutationFn: async (id: string) => {
            await supabase.from('case_notes').delete().eq('id', id)
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['case-notes'] }); setDeleteId(null); notify({ type: 'system', title: 'Case Note Deleted', message: 'The case note has been permanently deleted.' }) },
    })

    const filtered = notes.filter(n => {
        if (!search) return true
        const name = `${(n.patient as any)?.first_name} ${(n.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase()) || n.chief_complaint?.toLowerCase().includes(search.toLowerCase())
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Case Notes</h1>
                    <p className="text-sm text-slate-500">{notes.length} notes</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setPatientDisplay(''); setOpen(true) }} className="gap-1.5">
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
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No case notes yet</p>
                    <Button className="mt-5 gap-1.5" size="sm" onClick={() => { reset(); setOpen(true) }}><Plus className="w-4 h-4" />New Note</Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(note => (
                        <NoteCard key={note.id} note={note} onDelete={setDeleteId} />
                    ))}
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
                            <PatientSearchField
                                label="Patient"
                                required
                                value={patientDisplay}
                                error={errors.patient_id?.message}
                                onSelect={p => { setValue('patient_id', p.id, { shouldValidate: true }); setPatientDisplay(`${p.first_name} ${p.last_name} (${p.patient_number})`) }}
                                onClear={() => { setValue('patient_id', ''); setPatientDisplay('') }}
                            />
                            <Input label="Chief Complaint *" error={errors.chief_complaint?.message} {...register('chief_complaint')} />
                            {[['history', 'History'], ['examination', 'Examination Findings'], ['diagnosis', 'Diagnosis'], ['treatment_plan', 'Treatment Plan']].map(([f, l]) => (
                                <div key={f} className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{l}</label>
                                    <textarea className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" {...register(f as any)} />
                                </div>
                            ))}
                            <Input label="Follow-up Date" type="date" {...register('follow_up_date')} />

                            {/* Clinical Measurements */}
                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Clinical Measurements</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2 font-medium">Visual Acuity (VA)</p>
                                        <div className="space-y-2">
                                            <Input label="Right Eye (OD)" placeholder="e.g. 6/6" {...register('va_od')} />
                                            <Input label="Left Eye (OS)" placeholder="e.g. 6/9" {...register('va_os')} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-2 font-medium">Intraocular Pressure (IOP)</p>
                                        <div className="space-y-2">
                                            <Input label="Right Eye (OD)" placeholder="e.g. 14 mmHg" {...register('iop_od')} />
                                            <Input label="Left Eye (OS)" placeholder="e.g. 16 mmHg" {...register('iop_os')} />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-xs text-slate-500 mb-2 font-medium">CVF Analysis (Confrontation Visual Field)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Right Eye (OD)</label>
                                            <textarea className="w-full min-h-[60px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="e.g. Full to confrontation" {...register('cvf_od')} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Left Eye (OS)</label>
                                            <textarea className="w-full min-h-[60px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="e.g. Inferior defect" {...register('cvf_os')} />
                                        </div>
                                    </div>
                                </div>

                                {/* CVF Attachment */}
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">CVF Document Attachment (optional)</p>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                        {cvfFile ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <File className="w-5 h-5 text-blue-500" />
                                                <span className="text-sm font-medium text-slate-700">{cvfFile.name}</span>
                                                <button type="button" onClick={() => setCvfFile(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                                                    <X className="w-4 h-4 text-slate-400" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm text-slate-500">Click to upload CVF document</p>
                                                <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, PDF (max 10MB)</p>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) setCvfFile(file)
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="note-form" loading={isSubmitting || createMutation.isPending}>Save Note</Button>
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
