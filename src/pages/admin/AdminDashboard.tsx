import { useQuery } from '@tanstack/react-query'
import { Users, DollarSign, Calendar, AlertTriangle, UserCog, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

export function AdminDashboard() {
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const [patients, appointments, lowStock, staff] = await Promise.all([
                supabase.from('patients').select('id', { count: 'exact' }),
                supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', `${today}T00:00:00`),
                supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10),
                supabase.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
            ])
            return {
                totalPatients: patients.count ?? 0,
                appointmentsToday: appointments.count ?? 0,
                lowStockAlerts: lowStock.count ?? 0,
                activeStaff: staff.count ?? 0,
            }
        },
    })

    const statCards = [
        { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/patients' },
        { label: 'Appointments', value: stats?.appointmentsToday ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50', href: null },
        { label: 'Active Staff', value: stats?.activeStaff ?? 0, icon: UserCog, color: 'text-purple-600 bg-purple-50', href: '/admin/users' },
        { label: 'Low Stock', value: stats?.lowStockAlerts ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50', href: '/admin/inventory' },
        { label: "Revenue", value: '—', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', href: '/admin/reports' },
        { label: 'Pending Orders', value: '—', icon: Package, color: 'text-amber-600 bg-amber-50', href: null },
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
        </div>
    )
}
