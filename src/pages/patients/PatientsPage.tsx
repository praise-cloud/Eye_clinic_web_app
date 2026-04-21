import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Download, User, Phone, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter, DrawerCloseButton } from '@/components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/utils'
import type { Patient } from '@/types'

const patientSchema = z.object({
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
type PatientForm = z.infer<typeof patientSchema>

export function PatientsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [editPatient, setEditPatient] = useState<Patient | null>(null)
    const canWrite = ['assistant', 'admin'].includes(profile?.role ?? '')

    const { data: patients = [], isLoading } = useQuery({
        queryKey: ['patients', search],
        queryFn: async () => {
            let q = supabase.from('patients').select('*').order('created_at', { ascending: false })
            if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_number.ilike.%${search}%,phone.ilike.%${search}%`)
            const { data } = await q.limit(100)
            return (data ?? []) as Patient[]
        },
    })

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PatientForm>({
        resolver: zodResolver(patientSchema),
    })

    const saveMutation = useMutation({
        mutationFn: async (data: PatientForm) => {
            if (editPatient) await supabase.from('patients').update(data).eq('id', editPatient.id)
            else await supabase.from('patients').insert({ ...data, registered_by: profile?.id })
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setDrawerOpen(false); reset() },
    })

    const openNew = () => { setEditPatient(null); reset(); setDrawerOpen(true) }
    const openEdit = (p: Patient) => {
        setEditPatient(p)
        reset({ first_name: p.first_name, last_name: p.last_name, phone: p.phone, email: p.email, date_of_birth: p.date_of_birth, gender: p.gender, address: p.address, occupation: p.occupation, next_of_kin_name: p.next_of_kin_name, next_of_kin_phone: p.next_of_kin_phone, blood_group: p.blood_group, allergies: p.allergies, subscription_type: p.subscription_type })
        setDrawerOpen(true)
    }

    const exportCSV = () => {
        const rows = [['Patient #', 'First Name', 'Last Name', 'Phone', 'Email', 'Gender', 'Subscription', 'Registered'].join(','),
        ...patients.map(p => [p.patient_number, p.first_name, p.last_name, p.phone ?? '', p.email ?? '', p.gender ?? '', p.subscription_type ?? '', formatDate(p.created_at)].join(','))]
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'patients.csv'; a.click()
    }

    const subBadge: Record<string, 'default' | 'info' | 'warning' | 'success'> = { none: 'default', basic: 'info', standard: 'warning', premium: 'success' }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold">Patients</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{patients.length} records</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="hidden sm:flex">
                        <Download className="w-4 h-4" />Export
                    </Button>
                    {canWrite && (
                        <Button size="sm" onClick={openNew}>
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Register Patient</span>
                            <span className="sm:hidden">Add</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search name, number, phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Patient list */}
            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
            ) : patients.length === 0 ? (
                <Card><CardContent className="text-center py-16">
                    <User className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">No patients found</p>
                    {canWrite && <Button className="mt-4" size="sm" onClick={openNew}><Plus className="w-4 h-4" />Register First Patient</Button>}
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {patients.map(p => (
                        <Card key={p.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {p.first_name[0]}{p.last_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <Link to={`/patients/${p.id}`} className="font-semibold text-sm hover:text-primary truncate">
                                                {p.first_name} {p.last_name}
                                            </Link>
                                            <Badge variant={subBadge[p.subscription_type ?? 'none']} className="flex-shrink-0 text-xs">
                                                {p.subscription_type ?? 'none'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{p.patient_number}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            {p.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{p.phone}</span>}
                                            {p.email && <span className="flex items-center gap-1 text-xs text-muted-foreground truncate"><Mail className="w-3 h-3" /><span className="truncate max-w-[120px]">{p.email}</span></span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                        <Link to={`/patients/${p.id}`}><Button variant="ghost" size="sm" className="h-7 text-xs px-2">View</Button></Link>
                                        {canWrite && <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(p)}>Edit</Button>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Patient Form Drawer */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{editPatient ? 'Edit Patient' : 'Register New Patient'}</DrawerTitle>
                        <DrawerCloseButton />
                    </DrawerHeader>
                    <DrawerBody>
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
                                    <SelectTrigger label="Gender"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input label="Address" {...register('address')} />
                            <Input label="Occupation" {...register('occupation')} />
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Next of Kin" {...register('next_of_kin_name')} />
                                <Input label="Kin Phone" {...register('next_of_kin_phone')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Blood Group" placeholder="e.g. O+" {...register('blood_group')} />
                                <Select onValueChange={v => setValue('subscription_type', v as any)}>
                                    <SelectTrigger label="Subscription"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input label="Allergies" {...register('allergies')} />
                        </form>
                    </DrawerBody>
                    <DrawerFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="patient-form" loading={isSubmitting || saveMutation.isPending}>
                            {editPatient ? 'Save Changes' : 'Register Patient'}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}
