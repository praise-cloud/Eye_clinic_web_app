import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface AppNotification {
    id: string
    user_id?: string
    title: string
    message: string
    type: 'appointment' | 'prescription' | 'low_stock' | 'payment' | 'patient' | 'dispensing' | 'glasses' | 'system'
    is_read: boolean
    created_at: string
    link?: string
}

interface NotificationState {
    notifications: AppNotification[]
    unreadCount: number
    add: (n: Omit<AppNotification, 'id' | 'is_read' | 'created_at' | 'user_id'>, userId: string) => void
    markRead: (id: string, userId: string) => void
    markAllRead: (userId: string) => void
    remove: (id: string, userId: string) => void
    clear: (userId: string) => void
    setNotifications: (notifications: AppNotification[]) => void
    setUnreadCount: (count: number) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    add: (n, userId) => {
        // Prevent duplicates - check if same notification was recently added
        const { notifications } = get()
        const isDuplicate = notifications.some(existing => 
            existing.title === n.title && 
            existing.message === n.message &&
            existing.user_id === userId &&
            (Date.now() - new Date(existing.created_at).getTime()) < 10000
        )
        if (isDuplicate) return

        // Save to DB only - local state is updated via Realtime in NotificationBell
        supabase.from('notifications').insert({
            user_id: userId,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            is_read: false,
        }).select().then(({ data, error }) => {
            if (error) {
                console.error('Failed to save notification:', error)
            }
        })
    },

    markRead: (id, userId) => {
        supabase.from('notifications').update({ is_read: true }).eq('id', id).then(() => {
            set(s => {
                const target = s.notifications.find(n => n.id === id)
                const wasUnread = target && !target.is_read
                return {
                    notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
                    unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
                }
            })
        })
    },

    markAllRead: (userId) => {
        supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false).then(() => {
            set(s => ({
                notifications: s.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0,
            }))
        })
    },

    remove: (id, userId) => {
        supabase.from('notifications').delete().eq('id', id).then(() => {
            set(s => {
                const notification = s.notifications.find(n => n.id === id)
                const wasUnread = notification && !notification.is_read
                return {
                    notifications: s.notifications.filter(n => n.id !== id),
                    unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
                }
            })
        })
    },

    clear: (userId) => {
        supabase.from('notifications').delete().eq('user_id', userId).then(() => {
            set({ notifications: [], unreadCount: 0 })
        })
    },

    setNotifications: (notifications) => {
        set({
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length,
        })
    },

    setUnreadCount: (count) => set({ unreadCount: count }),
}))

// Helper to trigger notifications from anywhere (saves to DB)
export const notify = (n: Omit<AppNotification, 'id' | 'is_read' | 'created_at' | 'user_id'>, userId?: string) => {
    if (userId) {
        useNotificationStore.getState().add(n, userId)
        return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user?.id) return
        useNotificationStore.getState().add(n, user.id)
    })
}
