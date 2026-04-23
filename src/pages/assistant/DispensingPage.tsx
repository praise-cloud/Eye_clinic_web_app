import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pill, AlertTriangle, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { PatientSearchField } from '@/components/patients/PatientSearchField'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notify } from '@/store/notificationStore'
import type { Drug, DrugDispensing } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Required'),
    drug_id: z.string().min(1, 'Required'),
    quantity: z.number().min(1, 'Min 1'),
    prescription_note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function DispensingPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [open, setOpen] = useState(false)
    const [patientDisplay, setPatientDisplay] = useState('')
    const [drugSearch, setDrugSearch] = useState('')
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
    const [qty, setQty] = useState(1)

    const { data: recentDispensing = [], isLoading } = useQuery({
        queryKey: ['dispensing', 'recent'],
        queryFn: async () => {
            const { data } = await supabase.from('drug_dispensing')
                .select('*, patient:patients(first_name,last_name), drug:drugs(name,unit)')
                .order('dispensed_at', { ascending: false }).limit(30)
            return (data ?? []) as DrugDispensing[]
        },
    })

    const { data: lowStock = [] } = useQuery({
        queryKey: ['low-stock-drugs'],
        queryFn: async () => {
            const { data } = await supabase.from('low_stock_drugs').select('*')
            return (data ?? []) as Drug[]
        },
    })

    const { data: drugs = [] } = useQuery({
        queryKey: ['drugs-search', drugSearch],
        queryFn: async () => {
            const { data } = await supabase.from('drugs').select('*').ilike('name', `%${drugSearch}%`).gt('quantity', 0).limit(10)
            return (data ?? []) as Drug[]
        },
        enabled: drugSearch.length > 1,
    })

    const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema), defaultValues: { quantity: 1 },
    })

    const dispenseMutation = useMutation({
        mutationFn: async (data: FormData) => {
            if (!selectedDrug) throw new Error('No drug selected')
            if (data.quantity > selectedDrug.quantity) throw new Error(`Insufficient stock. Only ${selectedDrug.quantity} ${selectedDrug.unit}(s) available.`)
            await supabase.from('drug_dispensing').insert({
                patient_id: data.patient_id, drug_id: data.drug_id,
                dispensed_by: profile!.id, quantity: data.quantity,
                unit_price: selectedDrug.selling_price,
                prescription_note: data.prescription_note,
            })
            const totalAmount = selectedDrug.selling_price * data.quantity
            await supabase.from('payments').insert({
                patient_id: data.patient_id, payment_type: 'drug',
                amount: totalAmount, payment_method: 'cash',
                received_by: profile!.id,
                notes: `Drug dispensed: ${selectedDrug.name} × ${data.quantity}`,
            })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dispensing'] })
            qc.invalidateQueries({ queryKey: ['low-stock-drugs'] })
            setOpen(false); reset(); setSelectedDrug(null); setPatientDisplay(''); setDrugSearch('')
            notify({ type: 'dispensing', title: 'Drug Dispensed', message: `${selectedDrug?.name} has been dispensed.`, link: '/assistant/dispensing' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await supabase.from('drug_dispensing').delete().eq('id', id)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dispensing'] })
            qc.invalidateQueries({ queryKey: ['low-stock-drugs'] })
            notify({ type: 'system', title: 'Record Deleted', message: 'Dispensing record has been removed.' })
        },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Drug Dispensing</h1>
                    <p className="text-sm text-slate-500">Dispense drugs to patients</p>
                </div>
                <Button size="sm" onClick={() => { reset(); setOpen(true); setPatientDisplay(''); setDrugSearch(''); setSelectedDrug(null) }} className="gap-1.5">
                    <Pill className="w-3.5 h-3.5" />Dispense Drug
                </Button>
            </div>

            {lowStock.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">{lowStock.length} drug{lowStock.length > 1 ? 's' : ''} running low on stock</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Recent Dispensing</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
                                : recentDispensing.length === 0 ? <p className="text-center py-10 text-slate-400 text-sm">No dispensing records</p>
                                    : (
                                        <div className="divide-y divide-slate-50">
                                            {recentDispensing.map(d => (
                                                <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{(d.patient as any)?.first_name} {(d.patient as any)?.last_name}</p>
                                                        <p className="text-xs text-slate-400">{(d.drug as any)?.name} × {d.quantity} {(d.drug as any)?.unit} · {formatDate(d.dispensed_at)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(d.total_price ?? (d.unit_price * d.quantity))}</p>
                                                            <p className="text-xs text-slate-400">@ {formatCurrency(d.unit_price)}/{(d.drug as any)?.unit}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteMutation.mutate(d.id)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                                            title="Delete record"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Low Stock</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        {lowStock.length === 0 ? <p className="text-center py-6 text-sm text-slate-400">All stock levels OK ✓</p>
                            : (
                                <div className="divide-y divide-slate-50">
                                    {lowStock.map((d: any) => (
                                        <div key={d.id} className="px-4 py-2.5">
                                            <p className="text-sm font-medium text-slate-900">{d.name}</p>
                                            <p className="text-xs text-amber-600">{d.quantity} left (min: {d.reorder_level})</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>

            <Modal open={open} onOpenChange={setOpen}>
                <ModalContent size="md">
                    <ModalHeader><ModalTitle>Dispense Drug</ModalTitle></ModalHeader>
                    <ModalBody>
                        {dispenseMutation.isError && (
                            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                                {(dispenseMutation.error as Error).message}
                            </div>
                        )}
                        <form id="dispense-form" onSubmit={handleSubmit(d => dispenseMutation.mutate(d))} className="space-y-4">
                            <PatientSearchField
                                label="Patient" required
                                value={patientDisplay}
                                onSelect={p => { setValue('patient_id', p.id, { shouldValidate: true }); setPatientDisplay(`${p.first_name} ${p.last_name} (${p.patient_number})`) }}
                                onClear={() => { setValue('patient_id', ''); setPatientDisplay('') }}
                            />

                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Drug</label>
                                <input className="mt-1.5 w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search drug name..." value={drugSearch} onChange={e => setDrugSearch(e.target.value)} />
                                {drugs.length > 0 && (
                                    <div className="mt-1 border border-slate-100 rounded-xl divide-y max-h-40 overflow-y-auto bg-white shadow-card-md">
                                        {drugs.map(d => (
                                            <button key={d.id} type="button" className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                                                onClick={() => { setValue('drug_id', d.id); setSelectedDrug(d); setDrugSearch(`${d.name} (${d.quantity} in stock)`) }}>
                                                <span className="font-medium">{d.name}</span>
                                                <span className="text-slate-400 ml-2 text-xs">{d.quantity} {d.unit} · {formatCurrency(d.selling_price)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedDrug && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm space-y-1">
                                    <p className="font-semibold text-slate-900">{selectedDrug.name}</p>
                                    <p className="text-slate-500">Price: {formatCurrency(selectedDrug.selling_price)} / {selectedDrug.unit} · Stock: {selectedDrug.quantity}</p>
                                    {qty > 0 && <p className="font-bold text-emerald-600">Total: {formatCurrency(selectedDrug.selling_price * qty)}</p>}
                                </div>
                            )}

                            <Input label="Quantity" type="number" min={1} {...register('quantity', { valueAsNumber: true, onChange: e => setQty(parseInt(e.target.value) || 0) })} />
                            <Input label="Prescription Note (optional)" {...register('prescription_note')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" form="dispense-form" loading={isSubmitting || dispenseMutation.isPending}>Dispense</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
