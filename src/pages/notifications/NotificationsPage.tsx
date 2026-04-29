import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Trash2, Filter, Bell, Calendar, Pill, Package, DollarSign, User, Glasses, AlertTriangle, Info, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotificationStore } from '@/store/notificationStore'
import type { AppNotification } from '@/store/notificationStore'
import { cn } from '@/lib/utils'

const typeIcon: Record<AppNotification['type'], React.ElementType> = {
    appointment: Calendar,
    prescription: Pill,
    low_stock: AlertTriangle,
    payment: DollarSign,
    patient: User,
    dispensing: Pill,
    glasses: Glasses,
    system: Info,
}

const typeColor: Record<AppNotification['type'], string> = {
    appointment: 'bg-blue-100 text-blue-600 border-blue-200',
    prescription: 'bg-purple-100 text-purple-600 border-purple-200',
    low_stock: 'bg-amber-100 text-amber-600 border-amber-200',
    payment: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    patient: 'bg-teal-100 text-teal-600 border-teal-200',
    dispensing: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    glasses: 'bg-pink-100 text-pink-600 border-pink-200',
    system: 'bg-slate-100 text-slate-600 border-slate-200',
}

const typeLabel: Record<AppNotification['type'], string> = {
    appointment: 'Appointments',
    prescription: 'Prescriptions',
    low_stock: 'Low Stock',
    payment: 'Payments',
    patient: 'Patients',
    dispensing: 'Dispensing',
    glasses: 'Glasses',
    system: 'System',
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

export function NotificationsPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [filterType, setFilterType] = useState<string>('all')
    const [filterRead, setFilterRead] = useState<string>('all')

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', profile?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', profile!.id)
                .order('created_at', { ascending: false })
                .limit(200)
            if (error) throw error
            return (data ?? []) as AppNotification[]
        },
        enabled: !!profile?.id,
    })

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await supabase.from('notifications').update({ read: true }).eq('id', id)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', profile!.id)
                .eq('read', false)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await supabase.from('notifications').delete().eq('id', id)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const clearAllMutation = useMutation({
        mutationFn: async () => {
            await supabase.from('notifications').delete().eq('user_id', profile!.id)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    })

    const filtered = notifications.filter(n => {
        if (filterType !== 'all' && n.type !== filterType) return false
        if (filterRead === 'read' && !n.read) return false
        if (filterRead === 'unread' && n.read) return false
        return true
    })

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        {notifications.length} total · {unreadCount} unread
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllReadMutation.mutate()}
                            loading={markAllReadMutation.isPending}
                            className="gap-1.5"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearAllMutation.mutate()}
                            loading={clearAllMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(typeLabel).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterRead} onValueChange={setFilterRead}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-16">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">
                            {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {notifications.length === 0
                                ? 'Actions you take will appear here'
                                : 'Try adjusting your filters'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {filtered.map(n => {
                                const Icon = typeIcon[n.type]
                                const colorClass = typeColor[n.type]
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            'flex items-start gap-3 px-4 py-3.5 hover:bg-accent transition-colors',
                                            !n.read && 'bg-blue-50/40'
                                        )}
                                    >
                                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn('text-sm', !n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/90')}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <a
                                                    href={n.link}
                                                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
                                                >
                                                    View details →
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {!n.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => markReadMutation.mutate(n.id)}
                                                    title="Mark as read"
                                                >
                                                    <Mail className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteMutation.mutate(n.id)}
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                            {!n.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
