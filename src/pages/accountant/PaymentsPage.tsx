import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment, Patient } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Required'),
    payment_type: z.enum(['consultation', 'drug', 'glasses_deposit', 'glasses_balance', 'subscription', 'other']),
    amount: z.number().min(1, 'Required'),
    payment_method: z.enum(['cash', 'transfer', 'pos', 'other']),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const typeColor: Record<string, 'default' | 'info' | 'success' | 'warning'> = {
    consultation: 'info', drug: 'default', glasses_deposit: 'warning',
    glasses_balance: 'success', subscription: 'success', other: 'default',
}

export function PaymentsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [patientSearch, setPatientSearch] = useState('')

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments', search],
        queryFn: async () => {
            const { data } = await supabase.from('payments')
                .select('*, patient:patients(first_name,last_name,patient_number)')
                .order('paid_at', { ascending: false }).limit(100)
            return (data ?? []) as Payment[]
        },
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
            await supabase.from('payments').insert({ ...data, received_by: profile!.id })
        },
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['payments'] }); setDrawerOpen(false); reset(); setPatientSearch('') },
    })

    const filtered = payments.filter(p => {
        if (!search) return true
        const name = `${(p.patient as any)?.first_name} ${(p.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase()) || p.receipt_number.toLowerCase().includes(search.toLowerCase())
    })

    const total = filtered.reduce((s, p) => s + p.amount, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold">Payments</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{filtered.length} records · {formatCurrency(total)}</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setDrawerOpen(true) }}>
                    <Plus className="w-4 h-4" /><span className="hidden sm:inline">Record Payment</span><span className="sm:hidden">Add</span>
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient or receipt..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : filtered.length === 0 ? (
                <Card><CardContent className="text-center py-16">
                    <DollarSign className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">No payments found</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(p => (
                        <Card key={p.id}>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium truncate">{(p.patient as any)?.first_name} {(p.patient as any)?.last_name}</p>
                                            <Badge variant={typeColor[p.payment_type] ?? 'default'} className="text-xs capitalize">{p.payment_type.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="font-mono">{p.receipt_number}</span>
                                            <span>·</span>
                                            <span className="capitalize">{p.payment_method}</span>
                                            <span>·</span>
                                            <span>{formatDate(p.paid_at)}</span>
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-emerald-600 flex-shrink-0">{formatCurrency(p.amount)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={drawerOpen} onOpenChange={setDrawerOpen}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>Record Payment</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="payment-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Patient</label>
                                <input className="mt-1.5 w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                {patients.length > 0 && (
                                    <div className="mt-1 border rounded-lg divide-y max-h-40 overflow-y-auto bg-background shadow-sm">
                                        {patients.map(p => (
                                            <button key={p.id} type="button" className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted"
                                                onClick={() => { setValue('patient_id', p.id); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                {p.first_name} {p.last_name} · {p.patient_number}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id.message}</p>}
                            </div>
                            <Select onValueChange={v => setValue('payment_type', v as any)}>
                                <SelectTrigger label="Payment Type *" error={errors.payment_type?.message}><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="consultation">Consultation</SelectItem>
                                    <SelectItem value="drug">Drug</SelectItem>
                                    <SelectItem value="glasses_deposit">Glasses Deposit</SelectItem>
                                    <SelectItem value="glasses_balance">Glasses Balance</SelectItem>
                                    <SelectItem value="subscription">Subscription</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Amount (₦) *" type="number" error={errors.amount?.message} {...register('amount', { valueAsNumber: true })} />
                            <Select onValueChange={v => setValue('payment_method', v as any)}>
                                <SelectTrigger label="Payment Method *" error={errors.payment_method?.message}><SelectValue placeholder="Select method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="pos">POS</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input label="Notes" {...register('notes')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="payment-form" loading={isSubmitting || createMutation.isPending}>Record Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
