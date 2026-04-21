import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Users, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AccountantDashboard() {
    const { data: summary } = useQuery({
        queryKey: ['daily-summary', 'today'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase.from('daily_summary').select('*').eq('summary_date', today).single()
            return data
        },
    })

    const { data: recentPayments = [] } = useQuery({
        queryKey: ['payments', 'recent'],
        queryFn: async () => {
            const { data } = await supabase.from('payments')
                .select('*, patient:patients(first_name,last_name)')
                .order('paid_at', { ascending: false }).limit(8)
            return data ?? []
        },
    })

    const statCards = [
        { label: "Today's Revenue", value: formatCurrency(summary?.total_revenue ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Drug Sales', value: formatCurrency(summary?.drug_revenue ?? 0), icon: Package, color: 'text-blue-600 bg-blue-50' },
        { label: 'Glasses Sales', value: formatCurrency(summary?.glasses_revenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        { label: 'Total Visits', value: (summary?.new_patients ?? 0) + (summary?.returning_patients ?? 0), icon: Users, color: 'text-amber-600 bg-amber-50' },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg sm:text-xl font-bold">Financial Overview</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {statCards.map(stat => (
                    <Card key={stat.label}>
                        <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                            <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${stat.color}`}>
                                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                <p className="text-sm sm:text-base font-bold truncate">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm sm:text-base">Recent Transactions</CardTitle>
                        <Link to="/accountant/payments" className="text-xs text-primary hover:underline">View all</Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {recentPayments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">No transactions today</div>
                    ) : (
                        <div className="divide-y">
                            {recentPayments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{p.patient?.first_name} {p.patient?.last_name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{p.payment_type?.replace('_', ' ')} · {p.receipt_number}</p>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-2">{formatCurrency(p.amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
