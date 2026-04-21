import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { notify } from '@/store/notificationStore'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { GlassesOrder, Patient, GlassesInventory } from '@/types'

const schema = z.object({
    patient_id: z.string().min(1, 'Required'),
    frame_id: z.string().optional(),
    lens_type: z.string().optional(),
    lens_coating: z.string().optional(),
    lens_price: z.string().optional(),
    deposit_paid: z.string().optional(),
    estimated_ready: z.string().optional(),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const statusColor: Record<string, 'default' | 'warning' | 'info' | 'success' | 'destructive'> = {
    pending: 'warning', in_lab: 'info', ready: 'success', dispensed: 'default', cancelled: 'destructive',
}

const nextStatus: Record<string, string> = { pending: 'in_lab', in_lab: 'ready', ready: 'dispensed' }
const nextLabel: Record<string, string> = { pending: 'Send to Lab', in_lab: 'Mark Ready', ready: 'Dispense' }

export function GlassesOrdersPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [patientSearch, setPatientSearch] = useState('')
    const [selectedFrame, setSelectedFrame] = useState<GlassesInventory | null>(null)

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['glasses-orders'],
        queryFn: async () => {
            const { data } = await supabase.from('glasses_orders').select('*, patient:patients(first_name,last_name,patient_number), frame:glasses_inventory(frame_name,frame_brand)').order('created_at', { ascending: false })
            return (data ?? []) as GlassesOrder[]
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

    const { data: frames = [] } = useQuery({
        queryKey: ['glasses-inventory'],
        queryFn: async () => {
            const { data } = await supabase.from('glasses_inventory').select('*').gt('quantity', 0)
            return (data ?? []) as GlassesInventory[]
        },
    })

    const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

    const createMutation = useMutation({
        mutationFn: async (data: FormData) => {
            const framePrice = selectedFrame?.selling_price ?? 0
            const lensPrice = parseFloat(data.lens_price ?? '0') || 0
            await supabase.from('glasses_orders').insert({
                patient_id: data.patient_id, frame_id: data.frame_id || undefined,
                lens_type: data.lens_type, lens_coating: data.lens_coating,
                frame_price: framePrice, lens_price: lensPrice,
                total_price: framePrice + lensPrice,
                deposit_paid: parseFloat(data.deposit_paid ?? '0') || 0,
                estimated_ready: data.estimated_ready || undefined,
                notes: data.notes, created_by: profile!.id,
            })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['glasses-orders'] })
            setDrawerOpen(false)
            reset()
            setSelectedFrame(null)
            setPatientSearch('')
            notify({ type: 'glasses', title: 'Glasses Order Created', message: 'A new glasses order has been placed.', link: '/assistant/glasses-orders' })
        },
    })

    const advanceMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const update: Record<string, unknown> = { status }
            if (status === 'dispensed') { update.dispensed_by = profile!.id; update.dispensed_at = new Date().toISOString() }
            await supabase.from('glasses_orders').update(update).eq('id', id)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['glasses-orders'] })
            notify({ type: 'glasses', title: 'Order Status Updated', message: 'Glasses order status has been updated.', link: '/assistant/glasses-orders' })
        },
    })

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">Glasses Orders</h1><p className="text-sm text-muted-foreground">{orders.length} orders</p></div>
                <Button size="sm" onClick={() => { reset(); setDrawerOpen(true) }}><Plus className="w-4 h-4" />New Order</Button>
            </div>

            {isLoading ? <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div> : orders.length === 0 ? (
                <Card><CardContent className="text-center py-16"><Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" /><p className="text-muted-foreground">No glasses orders</p></CardContent></Card>
            ) : (
                <Card><CardContent className="p-0">
                    <div className="divide-y">
                        {orders.map(o => (
                            <div key={o.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{(o.patient as any)?.first_name} {(o.patient as any)?.last_name}</p>
                                        <span className="text-xs text-muted-foreground">{o.order_number}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {(o.frame as any)?.frame_name ?? 'No frame'} · {formatDate(o.created_at)}
                                        {o.total_price ? ` · ${formatCurrency(o.total_price)}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={statusColor[o.status]}>{o.status.replace('_', ' ')}</Badge>
                                    {nextStatus[o.status] && (
                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                            onClick={() => advanceMutation.mutate({ id: o.id, status: nextStatus[o.status] })}>
                                            {nextLabel[o.status]}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent></Card>
            )}

            <Modal open={drawerOpen} onOpenChange={setDrawerOpen}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>New Glasses Order</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="order-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
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
                            </div>
                            <Select onValueChange={v => { setValue('frame_id', v); setSelectedFrame(frames.find(f => f.id === v) ?? null) }}>
                                <SelectTrigger label="Frame (optional)"><SelectValue placeholder="Select frame" /></SelectTrigger>
                                <SelectContent>{frames.map(f => <SelectItem key={f.id} value={f.id}>{f.frame_name} {f.frame_brand ? `· ${f.frame_brand}` : ''} · {formatCurrency(f.selling_price)}</SelectItem>)}</SelectContent>
                            </Select>
                            {selectedFrame && <p className="text-xs text-muted-foreground">Frame price: {formatCurrency(selectedFrame.selling_price)}</p>}
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Lens Type" placeholder="e.g. Single Vision" {...register('lens_type')} />
                                <Input label="Lens Coating" placeholder="e.g. Anti-reflective" {...register('lens_coating')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Lens Price (₦)" type="number" {...register('lens_price')} />
                                <Input label="Deposit Paid (₦)" type="number" {...register('deposit_paid')} />
                            </div>
                            <Input label="Estimated Ready Date" type="date" {...register('estimated_ready')} />
                            <Input label="Notes" {...register('notes')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                        <Button type="submit" form="order-form" loading={isSubmitting || createMutation.isPending}>Create Order</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
