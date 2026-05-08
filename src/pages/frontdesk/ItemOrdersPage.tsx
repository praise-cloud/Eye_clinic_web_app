import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, Trash2 } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils'
import { notify } from '@/store/notificationStore'
import type { Patient } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Select a patient'),
    item_id: z.string().min(1, 'Select an item'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function ItemOrdersPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')
    const [selectedItem, setSelectedItem] = useState<any | null>(null)
    const [quantity, setQuantity] = useState(1)

    const { data: dispenses = [], isLoading } = useQuery({
        queryKey: ['inventory-dispensing'],
        queryFn: async () => {
            const { data } = await supabase
                .from('inventory_dispensing')
                .select('*, patient:patients(first_name,last_name,patient_number), item:inventory_others(name,unit)')
                .order('dispensed_at', { ascending: false })
            return data ?? []
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

    const { data: items = [] } = useQuery({
        queryKey: ['others-inventory'],
        queryFn: async () => {
            const { data } = await supabase.from('inventory_others').select('*').gt('quantity', 0)
            return (data ?? []) as any[]
        },
    })

    const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })
    const watchedQuantity = watch('quantity')
    useEffect(() => { setQuantity(watchedQuantity ?? 1) }, [watchedQuantity])

    const dispenseMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const item = items.find(i => i.id === data.item_id)
            const quantity = data.quantity
            const unitPrice = item?.selling_price ?? 0
            const { error } = await supabase.from('inventory_dispensing').insert({
                patient_id: data.patient_id,
                item_id: data.item_id,
                quantity,
                unit_price: unitPrice,
                total_price: unitPrice * quantity,
                notes: data.notes,
                dispensed_by: profile!.id,
            })
            if (error) throw error

            // Reduce inventory quantity
            if (item && item.quantity >= quantity) {
                await supabase.from('inventory_others').update({ quantity: item.quantity - quantity }).eq('id', data.item_id)
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventory-dispensing'] })
            qc.invalidateQueries({ queryKey: ['others-inventory'] })
            setDrawerOpen(false)
            reset()
            setSelectedItem(null)
            setPatientSearch('')
            notify({ type: 'dispensing', title: 'Item Dispensed', message: 'Inventory item has been dispensed to patient.', link: '/frontdesk/item-orders' }, profile?.id || '')
        },
        onError: (err: any) => { notify({ type: 'system', title: 'Error', message: err?.message || 'Failed to dispense item.' }, profile?.id || '') },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('inventory_dispensing').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['inventory-dispensing'] })
            qc.invalidateQueries({ queryKey: ['others-inventory'] })
            notify({ type: 'system', title: 'Record Deleted', message: 'Dispensing record has been removed.' }, profile?.id || '')
        },
        onError: (err: any) => { notify({ type: 'system', title: 'Error', message: err?.message || 'Failed to delete record.' }, profile?.id || '') },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">Inventory Dispensing</h1><p className="text-sm text-muted-foreground">{dispenses.length} records</p></div>
                <Button size="sm" onClick={() => { reset(); setSelectedItem(null); setPatientSearch(''); setDrawerOpen(true) }}><Plus className="w-4 h-4" />Dispense Item</Button>
            </div>

            {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div> : dispenses.length === 0 ? (
                <Card><CardContent className="text-center py-16"><Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No dispensing records</p></CardContent></Card>
            ) : (
                <Card><CardContent className="p-0">
                    <div className="divide-y">
                        {dispenses.map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between px-5 py-3 group">
                                <div>
                                    <p className="text-sm font-medium">{(d.patient as any)?.first_name} {(d.patient as any)?.last_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(d.item as any)?.name} · Qty: {d.quantity} {d.item?.unit} · {formatCurrency(d.total_price)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { if (confirm('Delete this dispensing record?')) deleteMutation.mutate(d.id) }}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                    title="Delete record"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            )}

            <Modal open={drawerOpen} onOpenChange={setDrawerOpen}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>Dispense Inventory Item</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="dispense-form" onSubmit={handleSubmit(d => dispenseMutation.mutate(d))} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Patient</label>
                                <input className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                {patients.length > 0 && (
                                    <div className="mt-1 border rounded-md divide-y max-h-40 overflow-y-auto">
                                        {patients.map(p => (
                                            <button key={p.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                                                onClick={() => { setValue('patient_id', p.id); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                {p.first_name} {p.last_name} · {p.patient_number}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.patient_id && <p className="text-xs text-destructive mt-1">{errors.patient_id.message}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Item</label>
                                <Select onValueChange={v => { setValue('item_id', v); setSelectedItem(items.find(i => i.id === v) ?? null) }}>
                                    <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => (
                                            <SelectItem key={i.id} value={i.id}>{i.name} · {i.quantity} left · {formatCurrency(i.selling_price)}/{i.unit}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.item_id && <p className="text-xs text-destructive mt-1">{errors.item_id.message}</p>}
                            </div>

                            {selectedItem && <p className="text-xs text-muted-foreground">Unit price: {formatCurrency(selectedItem.selling_price)} · Available: {selectedItem.quantity} {selectedItem.unit}</p>}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wide">Quantity</label>
                                    <input type="number" className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="1" {...register('quantity', { valueAsNumber: true })} />
                                    {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-medium uppercase tracking-wide">Total</label>
                                    <div className="mt-1.5 h-9 px-3 rounded-md border border-input bg-muted flex items-center text-sm font-medium">
                                        {selectedItem ? formatCurrency((selectedItem.selling_price ?? 0) * quantity) : '₦0.00'}
                                    </div>
                                </div>
                            </div>

                            <Input label="Notes" {...register('notes')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="dispense-form" loading={isSubmitting || dispenseMutation.isPending}>Dispense</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
