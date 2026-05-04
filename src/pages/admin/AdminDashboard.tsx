import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, DollarSign, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ActivityFeed } from '@/components/admin/ActivityFeed'

export function AdminDashboard() {
    const { data: stats, error: statsError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const todayStart = `${today}T00:00:00`
            const todayEnd = `${today}T23:59:59`

            const results = await Promise.allSettled([
                supabase.from('patients').select('id', { count: 'exact' }),
                supabase.from('drugs').select('quantity, reorder_level'),
                supabase.from('daily_summary').select('total_revenue, glasses_revenue').eq('summary_date', today).maybeSingle(),
                supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd),
                supabase.from('payments').select('amount').gte('paid_at', todayStart).lte('paid_at', todayEnd),
            ])

            const patients = results[0].status === 'fulfilled' ? results[0].value : { count: 0 }
            const drugs = results[1].status === 'fulfilled' ? results[1].value : { data: [] }
            const todayRevenue = results[2].status === 'fulfilled' ? results[2].value : { data: null }
            const todayAppointments = results[3].status === 'fulfilled' ? results[3].value : { count: 0 }
            const payments = results[4].status === 'fulfilled' ? results[4].value : { data: [] }

            const lowStockAlerts = (drugs.data ?? []).filter(d => Number(d.quantity ?? 0) <= Number(d.reorder_level ?? 10)).length
            const dailyRevenue = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

            return {
                totalPatients: patients.count ?? 0,
                lowStockAlerts,
                todayRevenue: todayRevenue.data?.total_revenue ?? dailyRevenue,
                todayGlassesRevenue: todayRevenue.data?.glasses_revenue ?? 0,
                todayAppointments: todayAppointments.count ?? 0,
            }
        },
    })

    const statCards = [
        { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/patients' },
        { label: "Today's Appointments", value: stats?.todayAppointments ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50', href: '/admin/appointments' },
        { label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', href: '/admin/reports' },
        { label: "Today's Glasses", value: formatCurrency(stats?.todayGlassesRevenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50', href: '/admin/reports' },
        { label: 'Low Stock', value: stats?.lowStockAlerts ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50', href: '/admin/inventory' },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg sm:text-xl font-bold">Admin Overview</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {statCards.map(stat => {
                    const content = (
                        <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                            <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${stat.color}`}>
                                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                            </div>
                        </CardContent>
                    )
                    return stat.href ? (
                        <Link key={stat.label} to={stat.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">{content}</Card>
                        </Link>
                    ) : (
                        <Card key={stat.label}>{content}</Card>
                    )
                })}
            </div>

            <div className="space-y-5">
                <ActivityFeed compact />
            </div>
        </div>
    )
}
