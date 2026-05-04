import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, MapPin, User, Calendar, FileText, Pill, CreditCard, Edit, Stethoscope, Package, AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate, formatCurrency, formatDateTime } from '../../lib/utils'
import { decryptText } from '../../lib/crypto'
import type { Patient, Appointment, CaseNote, Prescription, Payment } from '../../types'

const statusColor: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'info'> = {
    pending: 'warning', confirmed: 'info', arrived: 'success',
    completed: 'success', cancelled: 'destructive', no_show: 'destructive', in_progress: 'default',
}

export function PatientDetailPage() {
    const { id } = useParams<{ id: string }>()
    const { profile } = useAuthStore()
    const navigate = useNavigate()
    const qc = useQueryClient()
    const [tab, setTab] = useState('overview')
    const [editOpen, setEditOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

    const { data: patient, isLoading, error: patientError } = useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id!)
                .maybeSingle()
            if (error) {
                throw new Error(`Failed to load patient: ${error.message}`)
            }
            if (!data) {
                throw new Error('Patient not found. They may have been deleted or you may not have permission to view this record.')
            }
            return data as Patient
        },
        enabled: !!id,
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<{
        first_name: string
        last_name: string
        phone?: string
        email?: string
        date_of_birth?: string
        gender?: string
        address?: string
        occupation?: string
    }>()

    // Set form values when patient data loads
    useEffect(() => {
        if (patient) {
            setValue('first_name', patient.first_name || '', { shouldValidate: false })
            setValue('last_name', patient.last_name || '', { shouldValidate: false })
            setValue('phone', patient.phone || '', { shouldValidate: false })
            setValue('email', patient.email || '', { shouldValidate: false })
            setValue('date_of_birth', patient.date_of_birth || '', { shouldValidate: false })
            setValue('gender', patient.gender || '', { shouldValidate: false })
            setValue('address', patient.address || '', { shouldValidate: false })
            setValue('occupation', patient.occupation || '', { shouldValidate: false })
        }
    }, [patient, setValue])

    const editMutation = useMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase.from('patients').update({
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone || null,
                email: data.email || null,
                date_of_birth: data.date_of_birth || null,
                gender: data.gender || null,
                address: data.address || null,
                occupation: data.occupation || null,
            }).eq('id', id!)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['patient', id] })
            setEditOpen(false)
            reset()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (patientId: string) => {
            if (!patientId) throw new Error('No patient selected')
            const { error } = await supabase.from('patients').delete().eq('id', patientId)
            if (error) {
                if (error.code === '42501') throw new Error('You do not have permission to delete patients.')
                if (error.code === '23503' || error.code === '235000') throw new Error('Cannot delete patient: they have existing appointments, payments, or other linked records.')
                throw new Error(`Unable to delete patient: ${error.message}`)
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['patients'] })
            setDeleteTarget(null)
            navigate('/patients')
        },
        onError: (error: Error) => {
            alert(error.message)
        },
    })

    const { data: appointments = [], isLoading: appointmentsLoading, error: appointmentsError } = useQuery({
        queryKey: ['patient-appointments', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('appointments')
                .select('*, doctor:profiles!doctor_id(full_name)')
                .eq('patient_id', id!).order('scheduled_at', { ascending: false }).limit(20)
            if (error) throw error
            return (data ?? []) as Appointment[]
        },
        enabled: !!id && tab === 'appointments',
    })

    const { data: caseNotes = [], error: caseNotesError, isLoading: caseNotesLoading } = useQuery({
        queryKey: ['patient-notes', id],
        queryFn: async () => {
            const { data, error } = await supabase.from('case_notes')
                .select('*, doctor:profiles(full_name)')
                .eq('patient_id', id!).order('created_at', { ascending: false })
            if (error) throw new Error(error.message)
            return (data ?? []) as CaseNote[]
        },
        enabled: !!id,
        staleTime: 0,
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
                .select('*')
                .eq('patient_id', id!).order('paid_at', { ascending: false })
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

    const backHref = profile?.role === 'frontdesk' ? '/frontdesk/patients'
        : profile?.role === 'doctor' ? '/doctor/patients'
            : profile?.role === 'admin' ? '/admin/patients'
                : '/patients'

    if (isLoading) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    )

    if (patientError) return (
        <div className="text-center py-20">
            <p className="text-red-500 font-medium">Error loading patient</p>
            <p className="text-sm text-foreground400 mt-2">{patientError.message}</p>
            <Link to={backHref}><Button className="mt-4" variant="outline">Back to Patients</Button></Link>
        </div>
    )

    if (!patient) return (
        <div className="text-center py-20">
            <p className="text-foreground500">Patient not found</p>
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
                    <h1 className="text-xl font-bold text-foreground900 truncate">{patient.first_name} {patient.last_name}</h1>
                    <p className="text-sm text-foreground400 font-mono">{patient.patient_number}</p>
                </div>
                {/* Quick actions based on role */}
                <div className="flex gap-2 flex-shrink-0">
                    {profile?.role === 'frontdesk' && (
                        <>
                            <Link to={`/frontdesk/appointments?patient=${id}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
                                    <Calendar className="w-3.5 h-3.5" />Book Appt
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
                    {['frontdesk', 'admin'].includes(profile?.role ?? '') && (
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                            setValue('first_name', patient.first_name || '')
                            setValue('last_name', patient.last_name || '')
                            setValue('phone', patient.phone || '')
                            setValue('email', patient.email || '')
                            setValue('date_of_birth', patient.date_of_birth || '')
                            setValue('gender', patient.gender || '')
                            setValue('address', patient.address || '')
                            setValue('occupation', patient.occupation || '')
                            setEditOpen(true)
                        }}>
                            <Edit className="w-3.5 h-3.5" />Edit
                        </Button>
                    )}
                    {['frontdesk', 'admin'].includes(profile?.role ?? '') && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(patient)}>
                            <Trash2 className="w-3.5 h-3.5" />Delete
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
                            <p className="font-bold text-foreground900">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-foreground400 font-mono mt-0.5">{patient.patient_number}</p>
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
                            {patient.gender && <div className="flex justify-between"><span className="text-foreground400 text-xs">Gender</span><span className="capitalize text-sm">{patient.gender}</span></div>}
                            {patient.date_of_birth && <div className="flex justify-between"><span className="text-foreground400 text-xs">DOB</span><span className="text-sm">{formatDate(patient.date_of_birth)}</span></div>}
                            {patient.phone && <div className="flex items-center gap-2 text-foreground500 text-xs"><Phone className="w-3 h-3" />{patient.phone}</div>}
                            {patient.email && <div className="flex items-center gap-2 text-foreground500 text-xs"><Mail className="w-3 h-3" /><span className="truncate">{patient.email}</span></div>}
                            {patient.address && <div className="flex items-start gap-2 text-foreground500 text-xs"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{patient.address}</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Main content */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-xl overflow-x-auto">
                        {tabs.map(t => {
                            const Icon = t.icon
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                    ${tab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t.label}</span>
                                    {t.id === 'appointments' && appointments.length > 0 && (
                                        <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{appointments.length}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Overview */}
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs text-muted-foreground">Appointments</span>
                                    </div>
                                    <p className="text-2xl font-bold">{appointments.length}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-purple-500" />
                                        <span className="text-xs text-muted-foreground">Case Notes</span>
                                    </div>
                                    <p className="text-2xl font-bold">{caseNotes.length}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs text-muted-foreground">Payments</span>
                                    </div>
                                    <p className="text-2xl font-bold">{payments.length}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Appointments */}
                    {tab === 'appointments' && (
                        <Card>
                            <CardContent className="p-0">
                                {appointmentsLoading ? (
                                    <div className="p-8 space-y-3">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                                    </div>
                                ) : appointmentsError ? (
                                    <div className="p-8 text-center text-red-500">
                                        <p>Error loading appointments</p>
                                        <p className="text-xs mt-1">{appointmentsError.message}</p>
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <div className="text-center py-10 text-foreground400">
                                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No appointments yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {appointments.map(a => (
                                            <div key={a.id} className="flex items-center justify-between px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground900 capitalize">{a.appointment_type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-foreground400">{formatDateTime(a.scheduled_at)} · Dr. {(a.doctor as any)?.full_name}</p>
                                                </div>
                                                <Badge variant={statusColor[a.status] ?? 'default'} className="text-xs">{a.status.replace('_', ' ')}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Case Notes */}
                    {tab === 'notes' && (
                        <Card>
                            <CardContent className="p-0">
                                {caseNotesLoading ? (
                                    <div className="p-8 space-y-3">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                                    </div>
                                ) : caseNotesError ? (
                                    <div className="p-8 text-center text-red-500">
                                        <p>Error loading case notes</p>
                                    </div>
                                ) : caseNotes.length === 0 ? (
                                    <div className="text-center py-10 text-foreground400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No case notes yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {caseNotes.map(n => (
                                            <div key={n.id} className="px-5 py-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-medium text-foreground900">Dr. {(n.doctor as any)?.full_name}</p>
                                                    <span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                                                </div>
                                                <p className="text-xs text-foreground500">{n.chief_complaint}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Prescriptions */}
                    {tab === 'prescriptions' && (
                        <Card>
                            <CardContent className="p-0">
                                {prescriptions.length === 0 ? (
                                    <div className="text-center py-10 text-foreground400">
                                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No prescriptions yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {prescriptions.map(rx => (
                                            <div key={rx.id} className="px-5 py-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-medium text-foreground900 capitalize">{rx.lens_type?.replace('_', ' ') || 'Glasses Prescription'}</p>
                                                    <span className="text-xs text-muted-foreground">{formatDate(rx.created_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Payments */}
                    {tab === 'payments' && (
                        <Card>
                            <CardContent className="p-0">
                                {payments.length === 0 ? (
                                    <div className="text-center py-10 text-foreground400">
                                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No payment records</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground900 capitalize">{p.payment_type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-foreground400">{p.receipt_number} · {formatDate(p.paid_at)}</p>
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

            {/* Edit Patient Modal */}
            <Modal open={editOpen} onOpenChange={setEditOpen}>
                <ModalContent size="lg">
                    <ModalHeader>
                        <ModalTitle>Edit Patient</ModalTitle>
                        <ModalDescription>Update patient information</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        <form id="edit-patient-form" onSubmit={handleSubmit(d => editMutation.mutate(d))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="First Name *" {...register('first_name')} />
                                <Input placeholder="Last Name *" {...register('last_name')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Phone" {...register('phone')} />
                                <Input placeholder="Email" type="email" {...register('email')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Date of Birth" type="date" {...register('date_of_birth')} />
                                <Select onValueChange={v => setValue('gender', v)} defaultValue={patient?.gender}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input placeholder="Address" {...register('address')} />
                            <Input placeholder="Occupation" {...register('occupation')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button type="submit" form="edit-patient-form" loading={isSubmitting || editMutation.isPending}>Save Changes</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Patient Confirmation Modal */}
            <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />Delete Patient
                        </ModalTitle>
                        <ModalDescription className="text-red-500/80">
                            This action is <strong>permanent</strong> and cannot be undone.
                        </ModalDescription>
                    </ModalHeader>
                    <div className="px-6 py-3 bg-red-50 border border-red-100 rounded-xl mx-6 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center text-sm font-bold">
                                {deleteTarget?.first_name?.[0]}{deleteTarget?.last_name?.[0]}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-700">{deleteTarget?.first_name} {deleteTarget?.last_name}</p>
                                <p className="text-xs text-red-500 font-mono">{deleteTarget?.patient_number}</p>
                            </div>
                        </div>
                        <p className="text-xs text-red-400 mt-2">All appointments, prescriptions, and payments for this patient will also be removed.</p>
                    </div>
                    {deleteMutation.isError && (
                        <div className="px-6 pb-2">
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                {(deleteMutation.error as Error)?.message || 'Delete failed. Contact support.'}
                            </p>
                        </div>
                    )}
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancel</Button>
                        <Button variant="destructive" loading={deleteMutation.isPending} onClick={() => {
                            if (!deleteTarget) return
                            deleteMutation.mutate(deleteTarget.id)
                        }}>
                            Yes, Delete Patient
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
