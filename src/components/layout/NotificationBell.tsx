import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Calendar, Pill, Package, DollarSign, User, Glasses, AlertTriangle, Info, Link } from 'lucide-react'
import { useNotificationStore, AppNotification } from '@/store/notificationStore'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

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
  const { notifications, unreadCount, setNotifications, setUnreadCount } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Fetch notifications from DB on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data as AppNotification[])
      }
    }

    fetchNotifications()

    // Subscribe to new notifications via realtime
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload: any) => {
        const newNotification = payload.new as AppNotification
        // Only add if it's for current user
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && newNotification.user_id === user.id) {
            // Use setState callback to get fresh state
            useNotificationStore.setState(s => ({
              notifications: [newNotification, ...s.notifications].slice(0, 50),
              unreadCount: s.unreadCount + (newNotification.is_read ? 0 : 1),
            }))
          }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [setNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMarkRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (!error) {
      const updatedNotifications = notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
      setNotifications(updatedNotifications)
      setUnreadCount(updatedNotifications.filter(n => !n.is_read).length)
    }
  }

  const handleMarkAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }))
      setNotifications(updatedNotifications)
      setUnreadCount(0)
    }
  }

  const handleClearAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setNotifications([])
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
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
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-accent transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" />Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-slate-50 last:border-0',
                      !n.is_read && 'bg-blue-50/40'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm', !n.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/90')}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
                          onClick={() => {
                            setOpen(false)
                            if (!n.is_read) handleMarkRead(n.id)
                            navigate(n.link!)
                          }}
                        >
                          View details →
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="p-1 rounded hover:bg-slate-100"
                          title="Mark as read"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
