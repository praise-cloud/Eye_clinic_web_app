import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, DollarSign, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSearchField } from '@/components/patients/PatientSearchField'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notify } from '@/store/notificationStore'
import type { Payment } from '@/types'

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
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [patientDisplay, setPatientDisplay] = useState('')

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['payments'],
        queryFn: async () => {
            const { data } = await supabase.from('payments')
                .select('*, patient:patients(first_name,last_name,patient_number)')
                .order('paid_at', { ascending: false }).limit(100)
            return (data ?? []) as Payment[]
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const { error } = await supabase.from('payments').insert({ ...data, received_by: profile!.id })
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['payments'] })
            setOpen(false); reset(); setPatientDisplay('')
            notify({ type: 'payment', title: 'Payment Recorded', message: 'A new payment has been recorded.', link: '/admin/payments' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('payments').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['payments'] })
            notify({ type: 'system', title: 'Payment Deleted', message: 'Payment record has been removed.' })
        },
        onError: (err: any) => { notify({ type: 'system', title: 'Error', message: err?.message || 'Failed to delete payment.' }) },
    })

    const filtered = payments.filter(p => {
        if (!search) return true
        const name = `${(p.patient as any)?.first_name} ${(p.patient as any)?.last_name}`.toLowerCase()
        return name.includes(search.toLowerCase()) || p.receipt_number.toLowerCase().includes(search.toLowerCase())
    })

    const total = filtered.reduce((s, p) => s + p.amount, 0)

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground900">Payments</h1>
                    <p className="text-sm text-foreground500">{filtered.length} records · {formatCurrency(total)}</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setPatientDisplay(''); setOpen(true) }} className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Record Payment</span><span className="sm:hidden">Add</span>
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground400" />
                <input className="w-full pl-10 pr-4 h-10 rounded-xl border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm" placeholder="Search patient or receipt..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><DollarSign className="w-8 h-8 text-foreground300" /></div>
                    <p className="text-foreground500 font-medium">No payments found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(p => (
                        <Card key={p.id} className="hover:shadow-card-md transition-all">
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-foreground900 truncate">{(p.patient as any)?.first_name} {(p.patient as any)?.last_name}</p>
                                            <Badge variant={typeColor[p.payment_type] ?? 'default'} className="text-xs capitalize">{p.payment_type.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-foreground400 mt-0.5">
                                            <span className="font-mono">{p.receipt_number}</span>
                                            <span>·</span><span className="capitalize">{p.payment_method}</span>
                                            <span>·</span><span>{formatDate(p.paid_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <p className="text-base font-bold text-emerald-600">{formatCurrency(p.amount)}</p>
                                        <button
                                            onClick={() => { if (confirm('Delete this payment record?')) deleteMutation.mutate(p.id) }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                            title="Delete payment"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="md">
                    <ModalHeader><ModalTitle>Record Payment</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="payment-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                            <PatientSearchField
                                label="Patient" required
                                value={patientDisplay}
                                error={errors.patient_id?.message}
                                onSelect={p => { setValue('patient_id', p.id, { shouldValidate: true }); setPatientDisplay(`${p.first_name} ${p.last_name} (${p.patient_number})`) }}
                                onClear={() => { setValue('patient_id', ''); setPatientDisplay('') }}
                            />
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
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="payment-form" loading={isSubmitting || createMutation.isPending}>Record Payment</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
