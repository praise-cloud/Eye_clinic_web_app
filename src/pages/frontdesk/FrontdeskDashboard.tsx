import { useQuery } from '@tanstack/react-query'
import { Users, Pill, Package, Calendar, ChevronRight, Clock, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const statusVariant: Record<string, 'default' | 'warning' | 'success' | 'info' | 'destructive'> = {
    pending: 'warning', confirmed: 'info', arrived: 'success',
    in_progress: 'default', completed: 'success', cancelled: 'destructive',
}

export function FrontdeskDashboard() {
    const { profile } = useAuthStore()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['frontdesk-dashboard'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const todayStart = `${today}T00:00:00`
            const todayEnd = `${today}T23:59:59`

            const [p, a, l, paymentsResult, drugsResult] = await Promise.all([
                supabase.from('patients').select('id', { count: 'exact' }).gte('created_at', todayStart),
                supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd),
                supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10),
                supabase.from('payments').select('amount').gte('paid_at', todayStart).lte('paid_at', todayEnd),
                supabase.from('drugs').select('quantity, reorder_level'),
            ])

            const dailyRevenue = (paymentsResult.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
            const lowStockCount = (drugsResult.data ?? []).filter(d => Number(d.quantity ?? 0) <= Number(d.reorder_level ?? 10)).length

            return {
                newPatients: p.count ?? 0,
                appointments: a.count ?? 0,
                lowStock: lowStockCount,
                dailyRevenue: dailyRevenue,
            }
        },
        refetchInterval: 30000,
    })

    // All today's appointments (all doctors)
    const { data: appointments = [], isLoading: aptsLoading } = useQuery({
        queryKey: ['appointments', 'today-frontdesk'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('appointments')
                .select('*, patient:patients(first_name,last_name,patient_number), doctor:profiles(full_name)')
                .gte('scheduled_at', `${today}T00:00:00`)
                .lte('scheduled_at', `${today}T23:59:59`)
                .order('scheduled_at', { ascending: true })
                .limit(20)
            return data ?? []
        },
        refetchInterval: 15000,
        staleTime: 0,
    })

    const { data: lowStockDrugs = [] } = useQuery({
        queryKey: ['low-stock-drugs'],
        queryFn: async () => {
            const { data } = await supabase
                .from('drugs')
                .select('id, name, quantity, reorder_level')
                .order('quantity', { ascending: true })
                .limit(50)
            return (data ?? []).filter((drug) => Number(drug.quantity ?? 0) <= Number(drug.reorder_level ?? 0)).slice(0, 5)
        },
    })

    const statCards = [
        { label: 'New Patients', value: stats?.newPatients ?? 0, icon: Users, color: 'text-teal-600 bg-teal-50', href: '/frontdesk/patients' },
        { label: "Today's Appointments", value: stats?.appointments ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50', href: '/frontdesk/appointments' },
        { label: "Today's Revenue", value: `₦${(stats?.dailyRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', href: '/frontdesk/appointments' },
        { label: 'Low Stock', value: stats?.lowStock ?? 0, icon: Package, color: 'text-red-600 bg-red-50', href: '/frontdesk/inventory' },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground900">Hello, {profile?.full_name?.split(' ')[0]} 👋</h2>
                <p className="text-xs sm:text-sm text-foreground500 mt-0.5">{new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                {statCards.map(stat => (
                    <div key={stat.label} className={stat.href ? '' : 'cursor-default'}>
                        {stat.href ? (
                            <Link to={stat.href}>
                                <Card className="hover:shadow-card-md transition-all cursor-pointer">
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                                        <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${stat.color}`}>
                                            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-foreground500 truncate">{stat.label}</p>
                                            <p className="text-xl sm:text-2xl font-bold text-foreground900">{isLoading ? '—' : stat.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ) : (
                            <Card className="transition-all">
                                <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                                    <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${stat.color}`}>
                                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-foreground500 truncate">{stat.label}</p>
                                        <p className="text-xl sm:text-2xl font-bold text-foreground900">{isLoading ? '—' : stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Today's Appointments */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-base">Today's Appointments</CardTitle>
                                <Link to="/frontdesk/appointments">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">View all <ChevronRight className="w-3 h-3" /></Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {aptsLoading ? (
                                <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                            ) : appointments.length === 0 ? (
                                <div className="text-center py-10 text-foreground400">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No appointments today</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {appointments.map((apt: any) => (
                                        <div key={apt.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {apt.patient?.first_name?.[0]}{apt.patient?.last_name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground900 truncate">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                                                    <p className="text-xs text-foreground400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDateTime(apt.scheduled_at)} · Dr. {apt.doctor?.full_name}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={statusVariant[apt.status] ?? 'default'} className="flex-shrink-0 text-xs ml-2">
                                                {apt.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Low Stock */}
                <Card>
                    <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-amber-500" />Low Stock
                                </CardTitle>
                            </div>
                        </CardHeader>
                    <CardContent className="p-0">
                        {lowStockDrugs.length === 0 ? (
                            <p className="text-center py-6 text-sm text-foreground400">All stock levels OK ✓</p>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {lowStockDrugs.map((d: any) => (
                                    <div key={d.id} className="px-4 py-3">
                                        <p className="text-sm font-medium text-foreground900">{d.name}</p>
                                        <p className="text-xs text-amber-600 mt-0.5">{d.quantity} left (min: {d.reorder_level})</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
