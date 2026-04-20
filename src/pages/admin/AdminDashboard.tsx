import { useQuery } from '@tanstack/react-query'
import { Users, DollarSign, Calendar, AlertTriangle, UserCog, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function AdminDashboard() {
    const { profile } = useAuthStore()

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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Admin Overview</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                    { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Appointments Today', value: stats?.appointmentsToday ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Active Staff', value: stats?.activeStaff ?? 0, icon: UserCog, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Low Stock Alerts', value: stats?.lowStockAlerts ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
                    { label: "Today's Revenue", value: '—', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Pending Orders', value: '—', icon: Package, color: 'text-amber-600 bg-amber-50' },
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
        </div>
    )
}
