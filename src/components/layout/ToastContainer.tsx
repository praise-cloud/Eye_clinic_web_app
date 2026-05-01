import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info, Calendar, Pill, Package, DollarSign, User, Glasses } from 'lucide-react'
import { useNotificationStore, type AppNotification } from '@/store/notificationStore'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

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
    appointment: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500' },
    prescription: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-500' },
    low_stock: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500' },
    payment: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500' },
    patient: { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', icon: 'text-teal-500' },
    dispensing: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-500' },
    glasses: { bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800', icon: 'text-pink-500' },
    system: { bg: 'bg-muted', border: 'border-border', icon: 'text-muted-foreground' },
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
        // Removed auto-dismiss timer - toast now stays until user clicks it
        return () => { clearTimeout(enterTimer) }
    }, [notification.id])

    const handleDismiss = () => {
        if (exiting) return
        setExiting(true)
        setTimeout(() => {
            onDismiss(notification.id)
            // Mark as read in DB
            supabase.from('notifications').update({ read: true }).eq('id', notification.id)
        }, 300)
    }

    const content = (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm transition-all duration-300 ${colors.bg} ${colors.border} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${exiting ? 'opacity-0 translate-y-2 scale-95' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-card border ${colors.border}`}>
                <Icon className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{notification.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
            </div>
            <button
                onClick={handleDismiss}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
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
    const { notifications, remove, markRead } = useNotificationStore()

    // Only show the 3 most recent unread notifications
    const visibleToasts = notifications
        .filter(n => !n.read)
        .slice(0, 3)

    if (visibleToasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {visibleToasts.map(n => (
                <div key={n.id} className="pointer-events-auto">
                    <ToastItem notification={n} onDismiss={(id) => { markRead(id, n.user_id!) }} />
                </div>
            ))}
        </div>
    )
}
