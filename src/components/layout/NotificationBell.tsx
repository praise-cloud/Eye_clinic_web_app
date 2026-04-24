import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Calendar, Pill, Package, DollarSign, User, Glasses, AlertTriangle, Info } from 'lucide-react'
import { useNotificationStore, type AppNotification } from '@/store/notificationStore'
import { Link } from 'react-router-dom'
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
    appointment: 'bg-blue-100 text-blue-600',
    prescription: 'bg-purple-100 text-purple-600',
    low_stock: 'bg-amber-100 text-amber-600',
    payment: 'bg-emerald-100 text-emerald-600',
    patient: 'bg-teal-100 text-teal-600',
    dispensing: 'bg-indigo-100 text-indigo-600',
    glasses: 'bg-pink-100 text-pink-600',
    system: 'bg-slate-100 text-slate-600',
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, clear } = useNotificationStore()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleOpen = () => {
        setOpen(!open)
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-card-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">{unreadCount}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-accent transition-colors">
                                    <CheckCheck className="w-3.5 h-3.5" />Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={clear} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Bell className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                                <p className="text-xs mt-1 opacity-70">Actions you take will appear here</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const Icon = typeIcon[n.type]
                                const colorClass = typeColor[n.type]
                                const content = (
                                    <div
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        className={cn(
                                            'flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors cursor-pointer border-b border-slate-50 last:border-0',
                                            !n.read && 'bg-blue-50/40'
                                        )}
                                    >
                                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                        </div>
                                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                                    </div>
                                )
                                return n.link ? <Link key={n.id} to={n.link} onClick={() => setOpen(false)}>{content}</Link> : <div key={n.id}>{content}</div>
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
