import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Calendar, Pill, Package, DollarSign, User, Glasses, AlertTriangle, Info, Link } from 'lucide-react'
import { useNotificationStore, AppNotification } from '../../store/notificationStore'
import { cn } from '../../lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
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
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.is_read).length || 0)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
  }, [setNotifications, setUnreadCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      qc.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      qc.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      qc.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = typeIcon[notification.type]
                  const color = typeColor[notification.type]

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
                        !notification.is_read && 'bg-muted/30'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', color)}>
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
                              <p className="text-xs text-muted-foreground mt-1">
                                {timeAgo(notification.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
