import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info, Calendar, Pill, Package, DollarSign, User, Glasses } from 'lucide-react'
import { useNotificationStore, type AppNotification } from '@/store/notificationStore'
import { Link } from 'react-router-dom'

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

const typeColor: Record<AppNotification['type'], { bg: string; border: string; icon: string }> = {
    appointment: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
    prescription: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500' },
    low_stock: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
    payment: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500' },
    patient: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-500' },
    dispensing: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-500' },
    glasses: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-500' },
    system: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500' },
}

interface ToastItemProps {
    notification: AppNotification
    onDismiss: (id: string) => void
}

function ToastItem({ notification, onDismiss }: ToastItemProps) {
    const [visible, setVisible] = useState(false)
    const [exiting, setExiting] = useState(false)
    const Icon = typeIcon[notification.type]
    const colors = typeColor[notification.type]

    useEffect(() => {
        const enterTimer = setTimeout(() => setVisible(true), 50)
        const exitTimer = setTimeout(() => {
            setExiting(true)
            setTimeout(() => onDismiss(notification.id), 300)
        }, 4500)
        return () => { clearTimeout(enterTimer); clearTimeout(exitTimer) }
    }, [notification.id])

    const handleDismiss = () => {
        setExiting(true)
        setTimeout(() => onDismiss(notification.id), 300)
    }

    const content = (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm transition-all duration-300 ${colors.bg} ${colors.border} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${exiting ? 'opacity-0 translate-y-2 scale-95' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border ${colors.border}`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{notification.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
            <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )

    if (notification.link) {
        return (
            <Link to={notification.link} onClick={handleDismiss}>
                {content}
            </Link>
        )
    }
    return <div>{content}</div>
}

export function ToastContainer() {
    const { notifications, markRead } = useNotificationStore()
    const [recentIds, setRecentIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const latest = notifications.slice(0, 3)
        const latestIds = new Set(latest.map(n => n.id))
        if (latestIds.size > 0) {
            setRecentIds(prev => {
                const newIds = new Set([...prev, ...latestIds])
                return new Set([...newIds].slice(-5))
            })
        }
    }, [notifications])

    if (recentIds.size === 0) return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {notifications.slice(0, 3).map(n => (
                <div key={n.id} className="pointer-events-auto">
                    <ToastItem notification={n} onDismiss={(id) => { markRead(id); setRecentIds(prev => { const s = new Set(prev); s.delete(id); return s }) }} />
                </div>
            ))}
        </div>
    )
}