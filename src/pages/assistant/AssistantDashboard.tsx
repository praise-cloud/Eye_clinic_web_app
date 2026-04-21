import { useQuery } from '@tanstack/react-query'
import { Users, Pill, Package, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function AssistantDashboard() {
    const { profile } = useAuthStore()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['assistant-dashboard'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const [p, a, l] = await Promise.all([
                supabase.from('patients').select('id', { count: 'exact' }).gte('created_at', `${today}T00:00:00`),
                supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`),
                supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10),
            ])
            return { newPatients: p.count ?? 0, appointments: a.count ?? 0, lowStock: l.count ?? 0 }
        },
    })

    const { data: appointments = [] } = useQuery({
        queryKey: ['appointments', 'today-all'],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('appointments')
                .select('*, patient:patients(first_name,last_name), doctor:profiles(full_name)')
                .gte('scheduled_at', `${today}T00:00:00`)
                .lte('scheduled_at', `${today}T23:59:59`)
                .order('scheduled_at').limit(10)
            return data ?? []
        },
    })

    const statCards = [
        { label: 'New Patients', value: stats?.newPatients ?? 0, icon: Users, color: 'text-teal-600 bg-teal-50' },
        { label: 'Appointments', value: stats?.appointments ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
        { label: 'Low Stock', value: stats?.lowStock ?? 0, icon: Package, color: 'text-red-600 bg-red-50' },
        { label: 'Pending Rx', value: 0, icon: Pill, color: 'text-amber-600 bg-amber-50' },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg sm:text-xl font-bold">Hello, {profile?.full_name?.split(' ')[0]} 👋</h2>
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
                                <p className="text-xl sm:text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm sm:text-base">Today's Appointments</CardTitle>
                        <Link to="/assistant/appointments" className="text-xs text-primary hover:underline">View all</Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {appointments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No appointments today</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {appointments.map(apt => (
                                <div key={apt.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(apt.scheduled_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · Dr. {(apt.doctor as any)?.full_name}
                                        </p>
                                    </div>
                                    <Badge variant={apt.status === 'arrived' ? 'success' : apt.status === 'completed' ? 'default' : 'warning'} className="flex-shrink-0 text-xs">
                                        {apt.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
