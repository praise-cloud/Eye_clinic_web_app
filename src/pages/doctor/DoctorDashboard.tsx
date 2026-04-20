import { useQuery } from '@tanstack/react-query'
import { Calendar, FileText, Pill, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

export function DoctorDashboard() {
    const { profile } = useAuthStore()

    const { data: appointments, isLoading } = useQuery({
        queryKey: ['appointments', 'today', profile?.id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('appointments')
                .select('*, patient:patients(first_name, last_name, patient_number)')
                .eq('doctor_id', profile!.id)
                .gte('scheduled_at', `${today}T00:00:00`)
                .lte('scheduled_at', `${today}T23:59:59`)
                .order('scheduled_at')
            return data ?? []
        },
        enabled: !!profile,
    })

    const statusColor: Record<string, 'default' | 'warning' | 'success' | 'info' | 'destructive'> = {
        pending: 'warning', confirmed: 'info', arrived: 'success',
        in_progress: 'default', completed: 'success', cancelled: 'destructive', no_show: 'destructive',
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Good morning, Dr. {profile?.full_name?.split(' ')[0]} 👋</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Today's Appointments", value: appointments?.length ?? 0, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Awaiting', value: appointments?.filter(a => a.status === 'arrived').length ?? 0, icon: Users, color: 'text-amber-600 bg-amber-50' },
                    { label: 'Completed', value: appointments?.filter(a => a.status === 'completed').length ?? 0, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Pending Notes', value: 0, icon: Pill, color: 'text-purple-600 bg-purple-50' },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Today's Queue */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Patient Queue</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-5 space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                        </div>
                    ) : appointments?.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No appointments scheduled for today</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {appointments?.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                                            {(apt.patient as any)?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(apt.scheduled_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · {apt.appointment_type.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={statusColor[apt.status] ?? 'default'}>
                                        {apt.status.replace('_', ' ')}
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
