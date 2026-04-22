import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, User, Phone, Mail, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/utils'
import type { Patient } from '@/types'
import { notify } from '@/store/notificationStore'

const schema = z.object({
    first_name: z.string().min(1, 'Required'),
    last_name: z.string().min(1, 'Required'),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
    next_of_kin_name: z.string().optional(),
    next_of_kin_phone: z.string().optional(),
    blood_group: z.string().optional(),
    allergies: z.string().optional(),
    subscription_type: z.enum(['none', 'basic', 'standard', 'premium']).optional(),
})
type FormData = z.infer<typeof schema>

const subVariant: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
    none: 'default', basic: 'info', standard: 'warning', premium: 'success',
}

export function PatientsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [open, setOpen] = useState(false)
    const [editPatient, setEditPatient] = useState<Patient | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)
    // Only assistants can register/edit/delete patients — admin is read-only
    const canWrite = profile?.role === 'assistant'

    const { data: patients = [], isLoading } = useQuery({
        queryKey: ['patients', search],
        queryFn: async () => {
            let q = supabase.from('patients').select('*').order('created_at', { ascending: false })
            if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_number.ilike.%${search}%,phone.ilike.%${search}%`)
            const { data } = await q.limit(100)
            return (data ?? []) as Patient[]
        },
    })

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const saveMutation = useMutation({
        mutationFn: async (data: FormData) => {
            if (editPatient) await supabase.from('patients').update(data).eq('id', editPatient.id)
            else await supabase.from('patients').insert({ ...data, registered_by: profile?.id })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['patients'] })
            setOpen(false)
            reset()
            notify({
                type: 'patient',
                title: editPatient ? 'Patient Updated' : 'Patient Registered',
                message: editPatient
                    ? `${editPatient.first_name} ${editPatient.last_name}'s record has been updated.`
                    : 'A new patient has been registered successfully.',
                link: '/patients',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('patients').delete().eq('id', id)
            if (error) throw error
        },
        onMutate: async (id: string) => {
            // Optimistically remove from list immediately
            await qc.cancelQueries({ queryKey: ['patients', search] })
            const previous = qc.getQueryData(['patients', search])
            qc.setQueryData(['patients', search], (old: Patient[] = []) => old.filter(p => p.id !== id))
            return { previous }
        },
        onError: (_err, _id, context: any) => {
            // Rollback on error
            if (context?.previous) qc.setQueryData(['patients', search], context.previous)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['patients'] })
            setDeleteTarget(null)
            notify({ type: 'patient', title: 'Patient Deleted', message: 'Patient record has been permanently deleted.' })
        },
    })

    const openNew = () => { setEditPatient(null); reset(); setOpen(true) }
    const openEdit = (p: Patient) => {
        setEditPatient(p)
        reset({ first_name: p.first_name, last_name: p.last_name, phone: p.phone, email: p.email, date_of_birth: p.date_of_birth, gender: p.gender, address: p.address, occupation: p.occupation, next_of_kin_name: p.next_of_kin_name, next_of_kin_phone: p.next_of_kin_phone, blood_group: p.blood_group, allergies: p.allergies, subscription_type: p.subscription_type })
        setOpen(true)
    }

    const exportCSV = () => {
        const rows = [['Patient #', 'First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Subscription', 'Registered'].join(','),
        ...patients.map(p => [p.patient_number, p.first_name, p.last_name, p.phone ?? '', p.email ?? '', p.gender ?? '', p.subscription_type ?? '', formatDate(p.created_at)].join(','))]
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'patients.csv'; a.click()
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Patients</h1>
                    <p className="text-sm text-slate-500">{patients.length} registered patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="hidden sm:flex gap-1.5">
                        <Download className="w-3.5 h-3.5" />Export
                    </Button>
                    {canWrite && (
                        <Button size="sm" onClick={openNew} className="gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Register Patient</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    placeholder="Search by name, ID, or phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : patients.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No patients found</p>
                    <p className="text-slate-400 text-sm mt-1">Register your first patient to get started</p>
                    {canWrite && <Button className="mt-5 gap-1.5" onClick={openNew}><Plus className="w-4 h-4" />Register Patient</Button>}
                </div>
            ) : (
                <div className="space-y-2">
                    {patients.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-md transition-all group">
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                                    {p.first_name[0]}{p.last_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link to={`/patients/${p.id}`} className="font-semibold text-slate-900 hover:text-primary transition-colors text-sm">
                                            {p.first_name} {p.last_name}
                                        </Link>
                                        <span className="text-xs text-slate-400 font-mono">{p.patient_number}</span>
                                        <Badge variant={subVariant[p.subscription_type ?? 'none']} className="text-xs">{p.subscription_type ?? 'none'}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        {p.phone && <span className="flex items-center gap-1 text-xs text-slate-400"><Phone className="w-3 h-3" />{p.phone}</span>}
                                        {p.email && <span className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[160px]"><Mail className="w-3 h-3" />{p.email}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {canWrite && (
                                        <Button variant="ghost" size="sm" className="h-8 text-xs px-2.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(p)}>
                                            Edit
                                        </Button>
                                    )}
                                    {canWrite && (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(p)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                    <Link to={`/patients/${p.id}`}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="lg">
                    <ModalHeader>
                        <ModalTitle>{editPatient ? 'Edit Patient' : 'Register New Patient'}</ModalTitle>
                        <ModalDescription>{editPatient ? 'Update patient information' : 'Fill in the patient details below'}</ModalDescription>
                    </ModalHeader>
                    <ModalBody>
                        <form id="patient-form" onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="First Name *" error={errors.first_name?.message} {...register('first_name')} />
                                <Input label="Last Name *" error={errors.last_name?.message} {...register('last_name')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Phone" {...register('phone')} />
                                <Input label="Email" type="email" {...register('email')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Date of Birth" type="date" {...register('date_of_birth')} />
                                <Select onValueChange={v => setValue('gender', v as any)}>
                                    <SelectTrigger label="Gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input label="Address" {...register('address')} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Occupation" {...register('occupation')} />
                                <Input label="Blood Group" placeholder="e.g. O+" {...register('blood_group')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Next of Kin" {...register('next_of_kin_name')} />
                                <Input label="Kin Phone" {...register('next_of_kin_phone')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Select onValueChange={v => setValue('subscription_type', v as any)}>
                                    <SelectTrigger label="Subscription"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input label="Allergies" {...register('allergies')} />
                            </div>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="patient-form" loading={isSubmitting || saveMutation.isPending}>
                            {editPatient ? 'Save Changes' : 'Register Patient'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Patient Confirm */}
            <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <ModalContent size="sm">
                    <ModalHeader>
                        <ModalTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />Delete Patient
                        </ModalTitle>
                        <ModalDescription>
                            Permanently delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong> ({deleteTarget?.patient_number})? This will remove all their records. This cannot be undone.
                        </ModalDescription>
                    </ModalHeader>
                    {deleteMutation.isError && (
                        <div className="px-6 pb-2">
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                                {(deleteMutation.error as Error)?.message || 'Delete failed. Check RLS policies in Supabase.'}
                            </p>
                        </div>
                    )}
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" loading={deleteMutation.isPending}
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                            Delete Patient
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
