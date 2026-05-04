import { useQuery } from '@tanstack/react-query'
import { Calendar, FileText, Pill, Users, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

export function DoctorDashboard() {
    const { profile } = useAuthStore()

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['appointments', 'today', profile?.id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const todayStart = `${today}T00:00:00`
            const todayEnd = `${today}T23:59:59`
            const { data } = await supabase
                .from('appointments')
                .select('*, patient:patients(first_name,last_name,patient_number)')
                .eq('doctor_id', profile!.id)
                .gte('scheduled_at', todayStart)
                .lte('scheduled_at', todayEnd)
                .order('scheduled_at')
            return data ?? []
        },
        enabled: !!profile,
    })

    // Get dispensed drugs count for today
    const { data: dispensedToday = [] } = useQuery({
        queryKey: ['doctor', 'dispensed-today', profile?.id],
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0]
            const { data } = await supabase
                .from('drug_dispensing')
                .select('id', { count: 'exact' })
                .gte('dispensed_at', `${today}T00:00:00`)
                .lte('dispensed_at', `${today}T23:59:59`)
            return (data ?? []).length
        },
        enabled: !!profile,
    })

    const { data: pendingNotesData } = useQuery({
        queryKey: ['doctor', 'pending-notes', profile?.id],
        queryFn: async () => {
            const { data: apts } = await supabase
                .from('appointments')
                .select('id,patient:patients(first_name,last_name)')
                .eq('doctor_id', profile!.id)
                .eq('status', 'completed')
                .order('scheduled_at', { ascending: false })
                .limit(50)
            if (!apts || apts.length === 0) return { withoutNotes: 0, total: 0 }
            const aptIds = apts.map((a: any) => a.id)
            const { data: notes } = await supabase
                .from('case_notes')
                .select('appointment_id')
                .eq('doctor_id', profile!.id)
                .in('appointment_id', aptIds)
            const notedAptIds = new Set((notes ?? []).map((n: any) => n.appointment_id))
            const withoutNotes = apts.filter((a: any) => !notedAptIds.has(a.id)).length
            return { withoutNotes, total: apts.length }
        },
        enabled: !!profile,
    })

    const statusColor: Record<string, 'default' | 'warning' | 'success' | 'info' | 'destructive'> = {
        pending: 'warning', confirmed: 'info', arrived: 'success',
        in_progress: 'default', completed: 'success', cancelled: 'destructive', no_show: 'destructive',
    }

    const pendingCount = pendingNotesData?.withoutNotes ?? 0
    const stats = [
        { label: "Today's Appts", value: appointments.length, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
        { label: 'Pending/Awaiting', value: appointments.filter(a => ['pending', 'confirmed', 'arrived'].includes(a.status)).length, icon: Users, color: 'text-amber-600 bg-amber-50' },
        { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Dispensed Drugs', value: dispensedToday, icon: Pill, color: 'text-purple-600 bg-purple-50' },
        { label: 'Pending Notes', value: pendingCount, icon: Pill, color: 'text-orange-600 bg-orange-50', sub: pendingNotesData ? `${pendingNotesData.total} completed appts` : undefined },
    ]

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg sm:text-xl font-bold">Good morning, Dr. {profile?.full_name?.split(' ').slice(-1)[0]} 👋</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{formatDate(new Date())}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {stats.map(stat => (
                    <Card key={stat.label}>
                        <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                            <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${stat.color}`}>
                                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                <p className="text-xl sm:text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
                                {'sub' in stat && stat.sub && (
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{stat.sub}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm sm:text-base">Today's Queue</CardTitle>
                        <Link to="/doctor/appointments" className="text-xs text-primary hover:underline">View all</Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No appointments today</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {appointments.map(apt => (
                                <Link key={apt.id} to={`/patients/${apt.patient_id}`}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {(apt.patient as any)?.first_name?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(apt.scheduled_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · <span className="capitalize">{apt.appointment_type.replace('_', ' ')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={statusColor[apt.status] ?? 'default'} className="flex-shrink-0 text-xs">
                                        {apt.status.replace('_', ' ')}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
