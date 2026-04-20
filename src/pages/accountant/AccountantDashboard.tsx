import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Users, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AccountantDashboard() {
    const { data: summary } = useQuery({
        queryKey: ['daily-summary', 'today'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('daily_summary')
                .select('*')
                .eq('summary_date', today)
                .single()
            return data
        },
    })

    const { data: recentPayments } = useQuery({
        queryKey: ['payments', 'recent'],
        queryFn: async () => {
            const { data } = await supabase
                .from('payments')
                .select('*, patient:patients(first_name, last_name)')
                .order('paid_at', { ascending: false })
                .limit(10)
            return data ?? []
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Financial Overview</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Today's Revenue", value: formatCurrency(summary?.total_revenue ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Drug Sales', value: formatCurrency(summary?.drug_revenue ?? 0), icon: Package, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Glasses Sales', value: formatCurrency(summary?.glasses_revenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Total Visits', value: (summary?.new_patients ?? 0) + (summary?.returning_patients ?? 0), icon: Users, color: 'text-amber-600 bg-amber-50' },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="text-xl font-bold">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {!recentPayments?.length ? (
                        <div className="text-center py-10 text-muted-foreground">No transactions today</div>
                    ) : (
                        <div className="divide-y">
                            {recentPayments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-medium">{(p.patient as any)?.first_name} {(p.patient as any)?.last_name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{p.payment_type.replace('_', ' ')} · {p.receipt_number}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
