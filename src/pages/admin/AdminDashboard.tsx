import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { ActivityFeed } from '@/components/admin/ActivityFeed'

export function AdminDashboard() {
    const { data: stats, error: statsError } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const results = await Promise.allSettled([
                supabase.from('patients').select('id', { count: 'exact' }),
                supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10),
                supabase.from('daily_summary').select('total_revenue, glasses_revenue').eq('summary_date', today).maybeSingle(),
            ])
            
            const patients = results[0].status === 'fulfilled' ? results[0].value : { count: 0 }
            const lowStock = results[1].status === 'fulfilled' ? results[1].value : { count: 0 }
            const todayRevenue = results[2].status === 'fulfilled' ? results[2].value : { data: null }
            
            return {
                totalPatients: patients.count ?? 0,
                lowStockAlerts: lowStock.count ?? 0,
                todayRevenue: todayRevenue.data?.total_revenue ?? 0,
                todayGlassesRevenue: todayRevenue.data?.glasses_revenue ?? 0,
            }
        },
    })

    const statCards = [
        { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/patients' },
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
                <MiniCalendar compact />
                <ActivityFeed compact />
            </div>
        </div>
    )
}
