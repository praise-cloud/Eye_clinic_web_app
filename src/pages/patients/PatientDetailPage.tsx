import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, CreditCard, Edit } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Patient, Appointment, CaseNote, Prescription, Payment } from '@/types'

export function PatientDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { profile } = useAuthStore()
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
            const { data } = await supabase.from('appointments').select('*, doctor:profiles(full_name)').eq('patient_id', id!).order('scheduled_at', { ascending: false }).limit(20)
            return (data ?? []) as Appointment[]
        },
        enabled: !!id && tab === 'appointments',
    })

    const { data: caseNotes = [] } = useQuery({
        queryKey: ['patient-notes', id],
        queryFn: async () => {
            const { data } = await supabase.from('case_notes').select('*, doctor:profiles(full_name)').eq('patient_id', id!).order('created_at', { ascending: false })
            return (data ?? []) as CaseNote[]
        },
        enabled: !!id && tab === 'notes',
    })

    const { data: prescriptions = [] } = useQuery({
        queryKey: ['patient-prescriptions', id],
        queryFn: async () => {
            const { data } = await supabase.from('prescriptions').select('*, doctor:profiles(full_name)').eq('patient_id', id!).order('created_at', { ascending: false })
            return (data ?? []) as Prescription[]
        },
        enabled: !!id && tab === 'prescriptions',
    })

    const { data: payments = [] } = useQuery({
        queryKey: ['patient-payments', id],
        queryFn: async () => {
            const { data } = await supabase.from('payments').select('*').eq('patient_id', id!).order('paid_at', { ascending: false })
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

    const statusColor: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'info'> = {
        pending: 'warning', confirmed: 'info', arrived: 'success', completed: 'success', cancelled: 'destructive', no_show: 'destructive', in_progress: 'default',
    }

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>
    if (!patient) return <div className="text-center py-20"><p className="text-muted-foreground">Patient not found</p><Link to="/patients"><Button className="mt-4" variant="outline">Back to Patients</Button></Link></div>

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link to="/patients"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{patient.first_name} {patient.last_name}</h1>
                    <p className="text-sm text-muted-foreground">{patient.patient_number}</p>
                </div>
                {['assistant', 'admin'].includes(profile?.role ?? '') && (
                    <Link to={`/patients/${id}/edit`}><Button variant="outline" size="sm"><Edit className="w-4 h-4" />Edit</Button></Link>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Sidebar info */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold mb-2">
                                {patient.first_name[0]}{patient.last_name[0]}
                            </div>
                            <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-muted-foreground">{patient.patient_number}</p>
                            {patient.subscription_type && patient.subscription_type !== 'none' && (
                                <Badge variant="success" className="mt-1 capitalize">{patient.subscription_type}</Badge>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            {patient.gender && <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="capitalize">{patient.gender}</span></div>}
                            {patient.date_of_birth && <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{formatDate(patient.date_of_birth)}</span></div>}
                            {patient.blood_group && <div className="flex justify-between"><span className="text-muted-foreground">Blood Group</span><span>{patient.blood_group}</span></div>}
                            {patient.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3 h-3" /><span>{patient.phone}</span></div>}
                            {patient.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" /><span className="truncate text-xs">{patient.email}</span></div>}
                            {patient.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-3 h-3 mt-0.5" /><span className="text-xs">{patient.address}</span></div>}
                            {patient.allergies && <div className="pt-2 border-t"><p className="text-xs text-muted-foreground mb-1">Allergies</p><p className="text-xs text-destructive">{patient.allergies}</p></div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex gap-1 border-b overflow-x-auto">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                <t.icon className="w-3.5 h-3.5" />{t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <Card><CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="text-muted-foreground text-xs mb-1">Occupation</p><p>{patient.occupation || '—'}</p></div>
                            <div><p className="text-muted-foreground text-xs mb-1">Next of Kin</p><p>{patient.next_of_kin_name || '—'}</p></div>
                            <div><p className="text-muted-foreground text-xs mb-1">Next of Kin Phone</p><p>{patient.next_of_kin_phone || '—'}</p></div>
                            <div><p className="text-muted-foreground text-xs mb-1">Subscription</p><p className="capitalize">{patient.subscription_type || 'None'}</p></div>
                            {patient.subscription_end && <div><p className="text-muted-foreground text-xs mb-1">Subscription Ends</p><p>{formatDate(patient.subscription_end)}</p></div>}
                            <div><p className="text-muted-foreground text-xs mb-1">Registered</p><p>{formatDate(patient.created_at)}</p></div>
                        </CardContent></Card>
                    )}

                    {tab === 'appointments' && (
                        <Card><CardContent className="p-0">
                            {appointments.length === 0 ? <p className="text-center py-10 text-muted-foreground text-sm">No appointments</p> : (
                                <div className="divide-y">
                                    {appointments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between px-5 py-3">
                                            <div>
                                                <p className="text-sm font-medium capitalize">{a.appointment_type.replace('_', ' ')}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(a.scheduled_at)} · Dr. {(a.doctor as any)?.full_name}</p>
                                            </div>
                                            <Badge variant={statusColor[a.status] ?? 'default'}>{a.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent></Card>
                    )}

                    {tab === 'notes' && (
                        <div className="space-y-3">
                            {caseNotes.length === 0 ? <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No case notes</CardContent></Card> : (
                                caseNotes.map(n => (
                                    <Card key={n.id}><CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium">{n.chief_complaint || 'Case Note'}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                                        </div>
                                        {n.diagnosis && <p className="text-xs"><span className="text-muted-foreground">Diagnosis: </span>{n.diagnosis}</p>}
                                        {n.treatment_plan && <p className="text-xs"><span className="text-muted-foreground">Treatment: </span>{n.treatment_plan}</p>}
                                        <p className="text-xs text-muted-foreground">Dr. {(n.doctor as any)?.full_name}</p>
                                    </CardContent></Card>
                                ))
                            )}
                        </div>
                    )}

                    {tab === 'prescriptions' && (
                        <div className="space-y-3">
                            {prescriptions.length === 0 ? <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No prescriptions</CardContent></Card> : (
                                prescriptions.map(rx => (
                                    <Card key={rx.id}><CardContent className="p-4">
                                        <div className="flex justify-between mb-2">
                                            <p className="text-sm font-medium capitalize">{rx.lens_type?.replace('_', ' ') || 'Glasses Prescription'}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(rx.created_at)}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="space-y-1">
                                                <p className="font-medium text-muted-foreground">Right Eye</p>
                                                <p>Sph: {rx.re_sphere ?? '—'} | Cyl: {rx.re_cylinder ?? '—'} | Axis: {rx.re_axis ?? '—'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-muted-foreground">Left Eye</p>
                                                <p>Sph: {rx.le_sphere ?? '—'} | Cyl: {rx.le_cylinder ?? '—'} | Axis: {rx.le_axis ?? '—'}</p>
                                            </div>
                                        </div>
                                        {rx.pd && <p className="text-xs mt-1 text-muted-foreground">PD: {rx.pd}mm</p>}
                                    </CardContent></Card>
                                ))
                            )}
                        </div>
                    )}

                    {tab === 'payments' && (
                        <Card><CardContent className="p-0">
                            {payments.length === 0 ? <p className="text-center py-10 text-muted-foreground text-sm">No payments</p> : (
                                <div className="divide-y">
                                    {payments.map(p => (
                                        <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                            <div>
                                                <p className="text-sm font-medium capitalize">{p.payment_type.replace('_', ' ')}</p>
                                                <p className="text-xs text-muted-foreground">{p.receipt_number} · {formatDate(p.paid_at)}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent></Card>
                    )}
                </div>
            </div>
        </div>
    )
}
