import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface AppNotification {
    id: string
    user_id?: string
    title: string
    message: string
    type: 'appointment' | 'prescription' | 'low_stock' | 'payment' | 'patient' | 'dispensing' | 'glasses' | 'system'
    read: boolean
    created_at: string
    link?: string
}

interface NotificationState {
    notifications: AppNotification[]
    unreadCount: number
    add: (n: Omit<AppNotification, 'id' | 'read' | 'created_at' | 'user_id'>, userId: string) => void
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
        // Save to DB - userId is the person who should receive the notification
        supabase.from('notifications').insert({
            user_id: userId,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            read: false,
        }).then(({ data, error }) => {
            if (error) {
                console.error('Failed to save notification:', error)
                return
            }
            // Add to local state if we have the notification back and it's for current user
            const currentUser = useNotificationStore.getState()
            // Only add to local state if this notification is for the current user
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user && userId === user.id && data && data[0]) {
                    set(s => ({
                        notifications: [data[0] as AppNotification, ...s.notifications].slice(0, 50),
                        unreadCount: s.unreadCount + 1,
                    }))
                }
            })
        })
    },

    markRead: (id, userId) => {
        supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {
            set(s => {
                const target = s.notifications.find(n => n.id === id)
                const wasUnread = target && !target.read
                return {
                    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
                    unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
                }
            })
        })
    },

    markAllRead: (userId) => {
        supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false).then(() => {
            set(s => ({
                notifications: s.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0,
            }))
        })
    },

    remove: (id, userId) => {
        supabase.from('notifications').delete().eq('id', id).then(() => {
            set(s => {
                const notification = s.notifications.find(n => n.id === id)
                const wasUnread = notification && !notification.read
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
            unreadCount: notifications.filter(n => !n.read).length,
        })
    },

    setUnreadCount: (count) => set({ unreadCount: count }),
}))

// Helper to trigger notifications from anywhere (saves to DB)
export const notify = (n: Omit<AppNotification, 'id' | 'read' | 'created_at' | 'user_id'>, userId?: string) => {
    if (userId) {
        useNotificationStore.getState().add(n, userId)
        return
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user?.id) return
        useNotificationStore.getState().add(n, user.id)
    })
}
