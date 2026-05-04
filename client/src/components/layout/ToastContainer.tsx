import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info, Calendar, Pill, Package, DollarSign, User, Glasses } from 'lucide-react'
import { useNotificationStore } from '../../store/notificationStore'
import type { AppNotification } from '../../types'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

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
    return () => { clearTimeout(enterTimer) }
  }, [notification.id])

  const handleDismiss = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(() => {
      onDismiss(notification.id)
      // Mark as read in DB
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
        .then(({ error }) => {
          if (error) console.error('Failed to mark notification as read:', error)
        })
    }, 300)
  }

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (visible && !exiting) {
        handleDismiss()
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [visible, exiting, notification.id])

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300
        ${colors.bg} ${colors.border}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        ${exiting ? 'opacity-0 translate-y-2 scale-95' : ''}
      `}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-accent text-muted-foreground transition-colors flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        {notification.link && (
          <Link
            to={notification.link}
            className="text-xs text-primary hover:underline mt-1 inline-block"
            onClick={handleDismiss}
          >
            View details
          </Link>
        )}
      </div>
    </div>
  )
}

export function ToastContainer() {
  const { notifications, remove } = useNotificationStore()
  const { user } = useAuth()
  const [toasts, setToasts] = useState<AppNotification[]>([])

  // Show only unread notifications as toasts
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.is_read).slice(0, 3)
    setToasts(unreadNotifications)
  }, [notifications])

  const handleDismiss = (id: string) => {
    setToasts(prev => prev.filter(n => n.id !== id))
    if (user?.id) {
      remove(id, user.id)
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  )
}
