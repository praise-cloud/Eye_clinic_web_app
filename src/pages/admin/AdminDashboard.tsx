import { useQuery } from '@tanstack/react-query'
import { Users, DollarSign, Calendar, AlertTriangle, UserCog, Package, TrendingUp, ChevronRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MiniCalendar } from '@/components/calendar/MiniCalendar'
import { ActivityFeed } from '@/components/admin/ActivityFeed'

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'info' | 'destructive'> = {
    pending: 'warning', confirmed: 'info', arrived: 'success',
    in_progress: 'default', completed: 'success', cancelled: 'destructive',
}

export function AdminDashboard() {
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const [patients, appointments, lowStock, staff, todayRevenue] = await Promise.all([
                supabase.from('patients').select('id', { count: 'exact' }),
                supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', `${today}T00:00:00`),
                supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10),
                supabase.from('profiles').select('id', { count: 'exact' }).eq('is_active', true),
                supabase.from('daily_summary').select('total_revenue, glasses_revenue').eq('summary_date', today).single(),
            ])
            return {
                totalPatients: patients.count ?? 0,
                appointmentsToday: appointments.count ?? 0,
                lowStockAlerts: lowStock.count ?? 0,
                activeStaff: staff.count ?? 0,
                todayRevenue: todayRevenue?.data?.total_revenue ?? 0,
                todayGlassesRevenue: todayRevenue?.data?.glasses_revenue ?? 0,
            }
        },
    })

    const { data: todayAppointments = [], isLoading: aptsLoading } = useQuery({
        queryKey: ['admin-today-appointments'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('appointments')
                .select('*, patient:patients(first_name,last_name,patient_number), doctor:profiles!doctor_id(full_name)')
                .gte('scheduled_at', `${today}T00:00:00`)
                .lte('scheduled_at', `${today}T23:59:59`)
                .order('scheduled_at', { ascending: true })
                .limit(20)
            return data ?? []
        },
    })

    const statCards = [
        { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/patients' },
        { label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue ?? 0), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', href: '/admin/reports' },
        { label: "Today's Glasses", value: formatCurrency(stats?.todayGlassesRevenue ?? 0), icon: TrendingUp, color: 'text-purple-600 bg-purple-50', href: '/admin/reports' },
        { label: 'Appointments', value: stats?.appointmentsToday ?? 0, icon: Calendar, color: 'text-indigo-600 bg-indigo-50', href: null },
        { label: 'Active Staff', value: stats?.activeStaff ?? 0, icon: UserCog, color: 'text-purple-600 bg-purple-50', href: '/admin/users' },
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base">Today's Appointments</CardTitle>
                                <Link to="/admin/appointments">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">View all <ChevronRight className="w-3 h-3" /></Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {aptsLoading ? (
                                <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                            ) : todayAppointments.length === 0 ? (
                                <div className="text-center py-10 text-foreground400">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No appointments today</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {todayAppointments.map((apt: any) => (
                                        <Link key={apt.id} to={`/patients/${apt.patient_id}`} className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {apt.patient?.first_name?.[0]}{apt.patient?.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground900 truncate">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                                                    <p className="text-xs text-foreground400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(apt.scheduled_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · Dr. {apt.doctor?.full_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={statusVariant[apt.status] ?? 'default'} className="flex-shrink-0 text-xs ml-2">
                                                {apt.status.replace('_', ' ')}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-5">
                    <MiniCalendar compact />
                    <ActivityFeed compact />
                </div>
            </div>
        </div>
    )
}