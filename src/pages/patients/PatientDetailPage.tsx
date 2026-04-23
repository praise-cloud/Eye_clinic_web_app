import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, CreditCard, Edit, Stethoscope, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { decryptText } from '@/lib/crypto'
import type { Patient, Appointment, CaseNote, Prescription, Payment } from '@/types'

const statusColor: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'info'> = {
    pending: 'warning', confirmed: 'info', arrived: 'success',
    completed: 'success', cancelled: 'destructive', no_show: 'destructive', in_progress: 'default',
}

function DecryptedNote({ note }: { note: CaseNote }) {
    const [decrypted, setDecrypted] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const decrypt = async () => {
        if (Object.keys(decrypted).length > 0) { setExpanded(!expanded); return }
        setLoading(true)
        const result: Record<string, string> = {}
        for (const field of ['history', 'examination', 'diagnosis'] as const) {
            if (note[field]) {
                try { result[field] = await decryptText(note[field]!) } catch { result[field] = note[field]! }
            }
        }
        setDecrypted(result)
        setLoading(false)
        setExpanded(true)
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{note.chief_complaint || 'Case Note'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {(note.doctor as any)?.full_name} · {formatDate(note.created_at)}
                    </p>
                    {note.treatment_plan && !expanded && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">Treatment: {note.treatment_plan}</p>
                    )}
                </div>
                <button onClick={decrypt} className="text-xs text-primary hover:underline flex-shrink-0 font-medium">
                    {loading ? 'Loading...' : expanded ? 'Hide' : 'View Details'}
                </button>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    {(decrypted.history || note.history) && (
                        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">History</p>
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{decrypted.history || note.history}</p></div>
                    )}
                    {(decrypted.examination || note.examination) && (
                        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Examination</p>
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-line">{decrypted.examination || note.examination}</p></div>
                    )}
                    {(decrypted.diagnosis || note.diagnosis) && (
                        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Diagnosis</p>
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{decrypted.diagnosis || note.diagnosis}</p></div>
                    )}
                    {note.treatment_plan && (
                        <div><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Treatment Plan</p>
                            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{note.treatment_plan}</p></div>
                    )}
                    {note.follow_up_date && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />Follow-up: {formatDate(note.follow_up_date)}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function PatientDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const [tab, setTab] = useState('overview')

    const { data: patient, isLoading } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const { data } = await supabase.from('patients').select('*').eq('id', id!).single()
            return data as Patient
        },
        enabled: !!id,
    })

    const { data: appointments = [] } = useQuery({
        queryKey: ['patient-appointments', id],
        queryFn: async () => {
            const { data } = await supabase.from('appointments')
                .select('*, doctor:profiles(full_name)')
                .eq('patient_id', id!).order('scheduled_at', { ascending: false }).limit(20)
            return (data ?? []) as Appointment[]
        },
        enabled: !!id && tab === 'appointments',
    })

    const { data: caseNotes = [], isError: caseNotesError } = useQuery({
        queryKey: ['patient-notes', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('case_notes')
                .select('*, doctor:profiles(full_name)')
                .eq('patient_id', id!).order('created_at', { ascending: false })
            if (error) throw new Error(error.message)
            return (data ?? []) as CaseNote[]
        },
        enabled: !!id && tab === 'notes',
    })

    const { data: prescriptions = [] } = useQuery({
        queryKey: ['patient-prescriptions', id],
        queryFn: async () => {
            const { data } = await supabase.from('prescriptions')
                .select('*, doctor:profiles(full_name)')
                .eq('patient_id', id!).order('created_at', { ascending: false })
            return (data ?? []) as Prescription[]
        },
        enabled: !!id && tab === 'prescriptions',
    })

    const { data: payments = [] } = useQuery({
        queryKey: ['patient-payments', id],
        queryFn: async () => {
            const { data } = await supabase.from('payments')
                .select('*').eq('patient_id', id!).order('paid_at', { ascending: false })
            return (data ?? []) as Payment[]
        },
        enabled: !!id && tab === 'payments',
    })

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'notes', label: 'Case Notes', icon: FileText },
        { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
        { id: 'payments', label: 'Payments', icon: CreditCard },
    ]

    // Back navigation based on role
    const backHref = profile?.role === 'assistant' ? '/assistant/patients'
        : profile?.role === 'doctor' ? '/doctor/patients'
            : profile?.role === 'admin' ? '/admin/patients'
                : '/patients'

    if (isLoading) return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    )

    if (!patient) return (
        <div className="text-center py-20">
            <p className="text-slate-500">Patient not found</p>
            <Link to={backHref}><Button className="mt-4" variant="outline">Back to Patients</Button></Link>
        </div>
    )

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to={backHref}>
                    <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 truncate">{patient.first_name} {patient.last_name}</h1>
                    <p className="text-sm text-slate-400 font-mono">{patient.patient_number}</p>
                </div>
                {/* Quick actions based on role */}
                <div className="flex gap-2 flex-shrink-0">
                    {profile?.role === 'assistant' && (
                        <>
                            <Link to={`/assistant/appointments?patient=${id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                                    <Calendar className="w-3.5 h-3.5" />Book Appt
                                </Button>
                            </Link>
                            <Link to={`/assistant/dispensing`}>
                                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                                    <Pill className="w-3.5 h-3.5" />Dispense
                                </Button>
                            </Link>
                        </>
                    )}
                    {profile?.role === 'doctor' && (
                        <Link to={`/doctor/case-notes`}>
                            <Button size="sm" className="gap-1.5">
                                <FileText className="w-3.5 h-3.5" />New Note
                            </Button>
                        </Link>
                    )}
                    {['assistant'].includes(profile?.role ?? '') && (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(backHref)}>
                            <Edit className="w-3.5 h-3.5" />Edit
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Patient info sidebar */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold mb-3 shadow-sm">
                                {patient.first_name[0]}{patient.last_name[0]}
                            </div>
                            <p className="font-bold text-slate-900">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{patient.patient_number}</p>
                            {patient.subscription_type && patient.subscription_type !== 'none' && (
                                <Badge variant="success" className="mt-2 capitalize">{patient.subscription_type}</Badge>
                            )}
                        </div>

                        {patient.allergies && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-red-700 mb-0.5">Allergies</p>
                                    <p className="text-xs text-red-600">{patient.allergies}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 text-sm">
                            {patient.gender && <div className="flex justify-between"><span className="text-slate-400 text-xs">Gender</span><span className="capitalize text-sm">{patient.gender}</span></div>}
                            {patient.date_of_birth && <div className="flex justify-between"><span className="text-slate-400 text-xs">DOB</span><span className="text-sm">{formatDate(patient.date_of_birth)}</span></div>}
                            {patient.blood_group && <div className="flex justify-between"><span className="text-slate-400 text-xs">Blood Group</span><span className="text-sm font-semibold">{patient.blood_group}</span></div>}
                            {patient.phone && <div className="flex items-center gap-2 text-slate-500 text-xs"><Phone className="w-3 h-3" />{patient.phone}</div>}
                            {patient.email && <div className="flex items-center gap-2 text-slate-500 text-xs"><Mail className="w-3 h-3" /><span className="truncate">{patient.email}</span></div>}
                            {patient.address && <div className="flex items-start gap-2 text-slate-500 text-xs"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{patient.address}</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex gap-0.5 border-b border-slate-100 overflow-x-auto scrollbar-thin">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700'
                                    }`}>
                                <t.icon className="w-3.5 h-3.5" />{t.label}
                            </button>
                        ))}
                    </div>

                    {/* Overview */}
                    {tab === 'overview' && (
                        <Card>
                            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div><p className="text-xs text-slate-400 mb-1">Occupation</p><p className="font-medium">{patient.occupation || '—'}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Next of Kin</p><p className="font-medium">{patient.next_of_kin_name || '—'}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Kin Phone</p><p className="font-medium">{patient.next_of_kin_phone || '—'}</p></div>
                                <div><p className="text-xs text-slate-400 mb-1">Subscription</p><p className="font-medium capitalize">{patient.subscription_type || 'None'}</p></div>
                                {patient.subscription_end && <div><p className="text-xs text-slate-400 mb-1">Subscription Ends</p><p className="font-medium">{formatDate(patient.subscription_end)}</p></div>}
                                <div><p className="text-xs text-slate-400 mb-1">Registered</p><p className="font-medium">{formatDate(patient.created_at)}</p></div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Appointments */}
                    {tab === 'appointments' && (
                        <Card>
                            <CardContent className="p-0">
                                {appointments.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No appointments yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {appointments.map(a => (
                                            <div key={a.id} className="flex items-center justify-between px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 capitalize">{a.appointment_type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-slate-400">{formatDateTime(a.scheduled_at)} · Dr. {(a.doctor as any)?.full_name}</p>
                                                </div>
                                                <Badge variant={statusColor[a.status] ?? 'default'} className="text-xs">{a.status.replace('_', ' ')}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Case Notes — visible to all roles, decryptable */}
                    {tab === 'notes' && (
                        <div className="space-y-3">
                            {caseNotesError ? (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-8 h-8 text-red-300" />
                                    </div>
                                    <p className="text-sm text-red-500 font-medium">Failed to load case notes</p>
                                    <p className="text-xs text-red-400 mt-1">You may not have permission to view case notes.</p>
                                </div>
                            ) : caseNotes.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No case notes yet</p>
                                    {profile?.role === 'doctor' && (
                                        <Link to="/doctor/case-notes">
                                            <Button size="sm" className="mt-3 gap-1.5"><FileText className="w-3.5 h-3.5" />Write Note</Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                caseNotes.map(n => <DecryptedNote key={n.id} note={n} />)
                            )}
                        </div>
                    )}

                    {/* Prescriptions */}
                    {tab === 'prescriptions' && (
                        <div className="space-y-3">
                            {prescriptions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No prescriptions yet</p>
                                    {profile?.role === 'assistant' && (
                                        <Link to="/assistant/prescriptions">
                                            <Button size="sm" className="mt-3 gap-1.5"><Pill className="w-3.5 h-3.5" />Add Prescription</Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                prescriptions.map(rx => (
                                    <Card key={rx.id} className="hover:shadow-card-md transition-all">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 capitalize">{rx.lens_type?.replace('_', ' ') || 'Glasses Prescription'}</p>
                                                    <p className="text-xs text-slate-400">Dr. {(rx.doctor as any)?.full_name} · {formatDate(rx.created_at)}</p>
                                                </div>
                                                {rx.pd && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium">PD: {rx.pd}mm</span>}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1">Right Eye (OD)</p>
                                                    <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 rounded-xl p-2">
                                                        {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-slate-400 text-[10px]">{l}</p>)}
                                                        <p className="font-medium">{rx.re_sphere ?? '—'}</p>
                                                        <p className="font-medium">{rx.re_cylinder ?? '—'}</p>
                                                        <p className="font-medium">{rx.re_axis ?? '—'}</p>
                                                        <p className="font-medium">{rx.re_add ?? '—'}</p>
                                                    </div>
                                                    {rx.re_va && <p className="text-slate-500 mt-1">VA: {rx.re_va}</p>}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1">Left Eye (OS)</p>
                                                    <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 rounded-xl p-2">
                                                        {['Sph', 'Cyl', 'Axis', 'Add'].map(l => <p key={l} className="text-slate-400 text-[10px]">{l}</p>)}
                                                        <p className="font-medium">{rx.le_sphere ?? '—'}</p>
                                                        <p className="font-medium">{rx.le_cylinder ?? '—'}</p>
                                                        <p className="font-medium">{rx.le_axis ?? '—'}</p>
                                                        <p className="font-medium">{rx.le_add ?? '—'}</p>
                                                    </div>
                                                    {rx.le_va && <p className="text-slate-500 mt-1">VA: {rx.le_va}</p>}
                                                </div>
                                            </div>
                                            {rx.notes && <p className="text-xs text-slate-400 mt-2">{rx.notes}</p>}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {/* Payments */}
                    {tab === 'payments' && (
                        <Card>
                            <CardContent className="p-0">
                                {payments.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No payment records</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 capitalize">{p.payment_type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-slate-400">{p.receipt_number} · {formatDate(p.paid_at)}</p>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(p.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
