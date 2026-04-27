import { create } from 'zustand'

export interface AppNotification {
    id: string
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
    add: (n: Omit<AppNotification, 'id' | 'read' | 'created_at'>) => void
    markRead: (id: string) => void
    markAllRead: () => void
    remove: (id: string) => void
    clear: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    add: (n) => {
        const notification: AppNotification = {
            ...n,
            id: Math.random().toString(36).slice(2),
            read: false,
            created_at: new Date().toISOString(),
        }
        set(s => ({
            notifications: [notification, ...s.notifications].slice(0, 50),
            unreadCount: s.unreadCount + 1,
        }))
    },

    markRead: (id) => set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - (s.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
    })),

    markAllRead: () => set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
    })),

    remove: (id) => set(s => {
        const notification = s.notifications.find(n => n.id === id)
        return {
            notifications: s.notifications.filter(n => n.id !== id),
            unreadCount: Math.max(0, s.unreadCount - (notification && !notification.read ? 1 : 0)),
        }
    }),

    clear: () => set({ notifications: [], unreadCount: 0 }),
}))

// Helper to trigger notifications from anywhere
export const notify = (n: Omit<AppNotification, 'id' | 'read' | 'created_at'>) => {
    useNotificationStore.getState().add(n)
}
