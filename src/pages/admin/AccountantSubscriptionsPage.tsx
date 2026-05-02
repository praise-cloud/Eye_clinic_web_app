import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

export function SubscriptionsPage() {
    const { data: expiring = [], isLoading: expLoading } = useQuery({
        queryKey: ['expiring-subscriptions'],
        queryFn: async () => {
            const { data } = await supabase.from('expiring_subscriptions').select('*')
            return data ?? []
        },
    })

    const { data: all = [], isLoading: allLoading } = useQuery({
        queryKey: ['all-subscriptions'],
        queryFn: async () => {
            const { data } = await supabase
                .from('patients')
                .select('id,first_name,last_name,patient_number,phone,subscription_type,subscription_start,subscription_end')
                .neq('subscription_type', 'none')
                .order('subscription_end', { ascending: true })
            return data ?? []
        },
    })

    const subColor: Record<string, 'default' | 'info' | 'warning' | 'success'> = {
        basic: 'info', standard: 'warning', premium: 'success',
    }

    return (
        <div className="space-y-5">
            <div><h1 className="text-xl font-bold">Subscriptions</h1><p className="text-sm text-muted-foreground">Track patient subscription status</p></div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(['basic', 'standard', 'premium'] as const).map(type => {
                    const count = (all as any[]).filter(p => p.subscription_type === type).length
                    return (
                        <Card key={type}>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground capitalize mb-1">{type}</p>
                                <p className="text-2xl font-bold">{count}</p>
                            </CardContent>
                        </Card>
                    )
                })}
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs text-amber-600 mb-1">Expiring (30 days)</p>
                        <p className="text-2xl font-bold text-amber-600">{expiring.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Expiring soon */}
            {expiring.length > 0 && (
                <Card>
                    <CardContent className="p-0">
                        <div className="px-5 py-3 border-b bg-amber-50">
                            <p className="text-sm font-semibold text-amber-700">⚠ Expiring within 30 days</p>
                        </div>
                        <div className="divide-y">
                            {(expiring as any[]).map(p => (
                                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{p.phone} · {p.patient_number}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={p.days_remaining <= 7 ? 'destructive' : 'warning'} className="text-xs">
                                            {p.days_remaining}d left
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{formatDate(p.subscription_end)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* All subscriptions */}
            <Card>
                <CardContent className="p-0">
                    {allLoading ? <div className="p-4"><Skeleton className="h-48" /></div> : all.length === 0 ? (
                        <div className="text-center py-16">
                            <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">No active subscriptions</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/30">
                                <tr>{['Patient', 'Type', 'Start', 'End', 'Status'].map(h => (
                                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y">
                                {(all as any[]).map(p => {
                                    const expired = p.subscription_end && new Date(p.subscription_end) < new Date()
                                    return (
                                        <tr key={p.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-2.5">
                                                <p className="font-medium">{p.first_name} {p.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{p.patient_number}</p>
                                            </td>
                                            <td className="px-4 py-2.5"><Badge variant={subColor[p.subscription_type] ?? 'default'} className="capitalize">{p.subscription_type}</Badge></td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{p.subscription_start ? formatDate(p.subscription_start) : '—'}</td>
                                            <td className="px-4 py-2.5 text-muted-foreground">{p.subscription_end ? formatDate(p.subscription_end) : '—'}</td>
                                            <td className="px-4 py-2.5"><Badge variant={expired ? 'destructive' : 'success'}>{expired ? 'Expired' : 'Active'}</Badge></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
