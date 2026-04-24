import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, Glasses, MoreHorizontal, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/modal'
import { notify } from '@/store/notificationStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatCurrency } from '@/lib/utils'
import type { Drug, GlassesInventory } from '@/types'

const drugSchema = z.object({
    name: z.string().min(1, 'Required'),
    generic_name: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().min(1, 'Required'),
    quantity: z.number().min(0),
    reorder_level: z.number().min(0),
    purchase_price: z.number().optional(),
    selling_price: z.number().min(0, 'Required'),
    supplier: z.string().optional(),
    expiry_date: z.string().optional(),
})
type DrugForm = z.infer<typeof drugSchema>

const frameSchema = z.object({
    frame_name: z.string().min(1, 'Required'),
    frame_brand: z.string().optional(),
    frame_code: z.string().optional(),
    color: z.string().optional(),
    material: z.string().optional(),
    gender: z.enum(['male', 'female', 'unisex']).optional(),
    quantity: z.number().min(0),
    reorder_level: z.number().min(0),
    purchase_price: z.number().optional(),
    selling_price: z.number().min(0, 'Required'),
})
type FrameForm = z.infer<typeof frameSchema>

const othersSchema = z.object({
    name: z.string().min(1, 'Required'),
    category: z.string().optional(),
    unit: z.string().min(1, 'Required'),
    quantity: z.number().min(0),
    reorder_level: z.number().min(0),
    purchase_price: z.number().optional(),
    selling_price: z.number().min(0, 'Required'),
})
type OthersForm = z.infer<typeof othersSchema>

export function InventoryPage() {
    const qc = useQueryClient()
    const [activeTab, setActiveTab] = useState<'drugs' | 'glasses' | 'others'>('drugs')
    const [drugDrawer, setDrugDrawer] = useState(false)
    const [frameDrawer, setFrameDrawer] = useState(false)
    const [othersDrawer, setOthersDrawer] = useState(false)
    const [editDrug, setEditDrug] = useState<Drug | null>(null)
    const [editFrame, setEditFrame] = useState<GlassesInventory | null>(null)
    const [editOthers, setEditOthers] = useState<any | null>(null)

    const { data: drugs = [], isLoading: drugsLoading } = useQuery({
        queryKey: ['drugs'],
        queryFn: async () => { const { data } = await supabase.from('drugs').select('*').order('name'); return (data ?? []) as Drug[] },
    })

    const { data: frames = [], isLoading: framesLoading } = useQuery({
        queryKey: ['glasses-inventory'],
        queryFn: async () => { const { data } = await supabase.from('glasses_inventory').select('*').order('frame_name'); return (data ?? []) as GlassesInventory[] },
    })

    const { data: others = [], isLoading: othersLoading } = useQuery({
        queryKey: ['others-inventory'],
        queryFn: async () => { const { data } = await supabase.from('inventory_others').select('*').order('name'); return (data ?? []) as any[] },
    })

    const drugForm = useForm<DrugForm>({ resolver: zodResolver(drugSchema), defaultValues: { quantity: 0, reorder_level: 10, selling_price: 0 } })
    const frameForm = useForm<FrameForm>({ resolver: zodResolver(frameSchema), defaultValues: { quantity: 0, reorder_level: 5, selling_price: 0 } })
    const othersForm = useForm<OthersForm>({ resolver: zodResolver(othersSchema), defaultValues: { quantity: 0, reorder_level: 5, selling_price: 0, unit: 'piece' } })

    const saveDrug = useMutation({
        mutationFn: async (data: DrugForm) => {
            if (editDrug) await supabase.from('drugs').update(data).eq('id', editDrug.id)
            else await supabase.from('drugs').insert(data)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['drugs'] })
            setDrugDrawer(false)
            drugForm.reset()
            notify({ type: 'low_stock', title: editDrug ? 'Drug Updated' : 'Drug Added', message: editDrug ? 'Drug inventory item has been updated.' : 'A new drug has been added to inventory.', link: '/admin/inventory' })
        },
    })

    const saveFrame = useMutation({
        mutationFn: async (data: FrameForm) => {
            if (editFrame) await supabase.from('glasses_inventory').update(data).eq('id', editFrame.id)
            else await supabase.from('glasses_inventory').insert(data)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['glasses-inventory'] })
            setFrameDrawer(false)
            frameForm.reset()
            notify({ type: 'glasses', title: editFrame ? 'Frame Updated' : 'Frame Added', message: editFrame ? 'Glasses frame has been updated.' : 'A new frame has been added to inventory.', link: '/admin/inventory' })
        },
    })

    const saveOthers = useMutation({
        mutationFn: async (data: OthersForm) => {
            if (editFrame) await supabase.from('inventory_others').update(data).eq('id', editFrame.id)
            else await supabase.from('inventory_others').insert(data)
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['others-inventory'] })
            setOthersDrawer(false)
            othersForm.reset()
            notify({ type: 'system', title: editFrame ? 'Item Updated' : 'Item Added', message: editFrame ? 'Inventory item has been updated.' : 'A new item has been added to inventory.', link: '/admin/inventory' })
        },
    })

    const openEditDrug = (d: Drug) => {
        setEditDrug(d)
        drugForm.reset({ name: d.name, generic_name: d.generic_name, category: d.category, unit: d.unit, quantity: d.quantity, reorder_level: d.reorder_level, purchase_price: d.purchase_price, selling_price: d.selling_price, supplier: d.supplier, expiry_date: d.expiry_date })
        setDrugDrawer(true)
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-bold">Inventory</h1></div>
                <Button size="sm" onClick={() => { if (activeTab === 'drugs') { setEditDrug(null); drugForm.reset({ quantity: 0, reorder_level: 10, selling_price: 0, unit: 'piece' }); setDrugDrawer(true) } else if (activeTab === 'glasses') { setEditFrame(null); frameForm.reset({ quantity: 0, reorder_level: 5, selling_price: 0 }); setFrameDrawer(true) } else { setEditOthers(null); othersForm.reset({ quantity: 0, reorder_level: 5, selling_price: 0, unit: 'piece' }); setOthersDrawer(true) } }}>
                    <Plus className="w-4 h-4" />Add {activeTab === 'drugs' ? 'Drug' : activeTab === 'glasses' ? 'Frame' : 'Item'}
                </Button>
            </div>

            <div className="flex gap-1 border-b">
                {(['drugs', 'glasses', 'others'] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t === 'drugs' ? <Package className="w-3.5 h-3.5" /> : t === 'glasses' ? <Glasses className="w-3.5 h-3.5" /> : <MoreHorizontal className="w-3.5 h-3.5" />}{t === 'others' ? 'Items' : t}
                    </button>
                ))}
            </div>

            {activeTab === 'drugs' && (
                drugsLoading ? <Skeleton className="h-64" /> : (
                    <Card><CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[560px]">
                                <thead className="border-b bg-muted/30">
                                    <tr>{['Drug Name', 'Category', 'Stock', 'Unit', 'Price', 'Expiry', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {drugs.map(d => (
                                        <tr key={d.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-2.5"><p className="font-medium">{d.name}</p>{d.generic_name && <p className="text-xs text-muted-foreground">{d.generic_name}</p>}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{d.category || '—'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={d.quantity <= d.reorder_level ? 'text-amber-600 font-medium' : ''}>{d.quantity}</span>
                                                {d.quantity <= d.reorder_level && <Badge variant="warning" className="ml-2 text-xs">Low</Badge>}
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{d.unit}</td>
                                            <td className="px-4 py-2.5">{formatCurrency(d.selling_price)}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{d.expiry_date || '—'}</td>
                                            <td className="px-4 py-2.5"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEditDrug(d)}>Edit</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {drugs.length === 0 && <p className="text-center py-10 text-muted-foreground">No drugs in inventory</p>}
                        </div>
                    </CardContent></Card>
                )
            )}

            {activeTab === 'glasses' && (
                framesLoading ? <Skeleton className="h-64" /> : (
                    <Card><CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[480px]">
                                <thead className="border-b bg-muted/30">
                                    <tr>{['Frame', 'Brand', 'Code', 'Stock', 'Price', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {frames.map(f => (
                                        <tr key={f.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-2.5 font-medium">{f.frame_name}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{f.frame_brand || '—'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{f.frame_code || '—'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={f.quantity <= f.reorder_level ? 'text-amber-600 font-medium' : ''}>{f.quantity}</span>
                                                {f.quantity <= f.reorder_level && <Badge variant="warning" className="ml-2 text-xs">Low</Badge>}
                                            </td>
                                            <td className="px-4 py-2.5">{formatCurrency(f.selling_price)}</td>
                                            <td className="px-4 py-2.5"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditFrame(f); frameForm.reset({ frame_name: f.frame_name, frame_brand: f.frame_brand, frame_code: f.frame_code, color: f.color, material: f.material, gender: f.gender, quantity: f.quantity, reorder_level: f.reorder_level, purchase_price: f.purchase_price, selling_price: f.selling_price }); setFrameDrawer(true) }}>Edit</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {frames.length === 0 && <p className="text-center py-10 text-muted-foreground">No frames in inventory</p>}
                        </div>
                    </CardContent></Card>
                )
            )}

            {activeTab === 'others' && (
                othersLoading ? <Skeleton className="h-64" /> : (
                    <Card><CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[480px]">
                                <thead className="border-b bg-muted/30">
                                    <tr>{['Item Name', 'Category', 'Stock', 'Unit', 'Price', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {others.map(o => (
                                        <tr key={o.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-2.5 font-medium">{o.name}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{o.category || '—'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={o.quantity <= o.reorder_level ? 'text-amber-600 font-medium' : ''}>{o.quantity}</span>
                                                {o.quantity <= o.reorder_level && <Badge variant="warning" className="ml-2 text-xs">Low</Badge>}
                                            </td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{o.unit}</td>
                                            <td className="px-4 py-2.5">{formatCurrency(o.selling_price)}</td>
                                            <td className="px-4 py-2.5"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditOthers(o); othersForm.reset({ name: o.name, category: o.category, unit: o.unit, quantity: o.quantity, reorder_level: o.reorder_level, purchase_price: o.purchase_price, selling_price: o.selling_price }); setOthersDrawer(true) }}>Edit</Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {others.length === 0 && <p className="text-center py-10 text-muted-foreground">No items in others inventory</p>}
                        </div>
                    </CardContent></Card>
                )
            )}

            {/* Drug Drawer */}
            <Modal open={drugDrawer} onOpenChange={setDrugDrawer}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>{editDrug ? 'Edit Drug' : 'Add Drug'}</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="drug-form" onSubmit={drugForm.handleSubmit(d => saveDrug.mutate(d))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Drug Name *" error={drugForm.formState.errors.name?.message} {...drugForm.register('name')} />
                                <Input label="Generic Name" {...drugForm.register('generic_name')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Category" {...drugForm.register('category')} />
                                <Input label="Unit *" placeholder="piece, bottle, tube" {...drugForm.register('unit')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Quantity" type="number" {...drugForm.register('quantity', { valueAsNumber: true })} />
                                <Input label="Reorder Level" type="number" {...drugForm.register('reorder_level', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Purchase Price (₦)" type="number" {...drugForm.register('purchase_price', { valueAsNumber: true })} />
                                <Input label="Selling Price (₦) *" type="number" error={drugForm.formState.errors.selling_price?.message} {...drugForm.register('selling_price', { valueAsNumber: true })} />
                            </div>
                            <Input label="Supplier" {...drugForm.register('supplier')} />
                            <Input label="Expiry Date" type="date" {...drugForm.register('expiry_date')} />
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setDrugDrawer(false)}>Cancel</Button>
                        <Button type="submit" form="drug-form" loading={saveDrug.isPending}>{editDrug ? 'Save Changes' : 'Add Drug'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Frame Drawer */}
            <Modal open={frameDrawer} onOpenChange={setFrameDrawer}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>{editFrame ? 'Edit Frame' : 'Add Frame'}</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="frame-form" onSubmit={frameForm.handleSubmit(d => saveFrame.mutate(d))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Frame Name *" error={frameForm.formState.errors.frame_name?.message} {...frameForm.register('frame_name')} />
                                <Input label="Brand" {...frameForm.register('frame_brand')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Frame Code" {...frameForm.register('frame_code')} />
                                <Select onValueChange={v => frameForm.setValue('gender', v as any)}>
                                    <SelectTrigger label="Gender"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="unisex">Unisex</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Color" {...frameForm.register('color')} />
                                <Input label="Material" {...frameForm.register('material')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Quantity" type="number" {...frameForm.register('quantity', { valueAsNumber: true })} />
                                <Input label="Reorder Level" type="number" {...frameForm.register('reorder_level', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Purchase Price (₦)" type="number" {...frameForm.register('purchase_price', { valueAsNumber: true })} />
                                <Input label="Selling Price (₦) *" type="number" error={frameForm.formState.errors.selling_price?.message} {...frameForm.register('selling_price', { valueAsNumber: true })} />
                            </div>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setFrameDrawer(false)}>Cancel</Button>
                        <Button type="submit" form="frame-form" loading={saveFrame.isPending}>{editFrame ? 'Save Changes' : 'Add Frame'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Others/Items Drawer */}
            <Modal open={othersDrawer} onOpenChange={setOthersDrawer}>
                <ModalContent size="lg">
                    <ModalHeader><ModalTitle>{editOthers ? 'Edit Item' : 'Add Item'}</ModalTitle></ModalHeader>
                    <ModalBody>
                        <form id="others-form" onSubmit={othersForm.handleSubmit(d => saveOthers.mutate(d))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Item Name *" error={othersForm.formState.errors.name?.message} {...othersForm.register('name')} />
                                <Input label="Category" {...othersForm.register('category')} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Unit *" placeholder="piece, box, pack" {...othersForm.register('unit')} />
                                <Input label="Quantity" type="number" {...othersForm.register('quantity', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Reorder Level" type="number" {...othersForm.register('reorder_level', { valueAsNumber: true })} />
                                <Input label="Selling Price (₦) *" type="number" error={othersForm.formState.errors.selling_price?.message} {...othersForm.register('selling_price', { valueAsNumber: true })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Purchase Price (₦)" type="number" {...othersForm.register('purchase_price', { valueAsNumber: true })} />
                            </div>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setOthersDrawer(false)}>Cancel</Button>
                        <Button type="submit" form="others-form" loading={saveOthers.isPending}>{editOthers ? 'Save Changes' : 'Add Item'}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    )
}
