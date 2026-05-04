import { create } from 'zustand'
import type { AppNotification } from '@/types'

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  add: (notification: Omit<AppNotification, 'id' | 'created_at' | 'user_id' | 'is_read'>) => void
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

  add: (notification) => {
    const { notifications } = get()
    const newNotification: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      user_id: 'current-user', // Will be set properly in real app
      is_read: false,
      ...notification
    }
    
    set({
      notifications: [newNotification, ...notifications],
      unreadCount: get().unreadCount + 1
    })
  },

  markRead: (id, userId) => {
    const { notifications } = get()
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    )
    const unreadCount = updatedNotifications.filter(n => !n.is_read).length
    
    set({
      notifications: updatedNotifications,
      unreadCount
    })
  },

  markAllRead: (userId) => {
    const { notifications } = get()
    const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }))
    
    set({
      notifications: updatedNotifications,
      unreadCount: 0
    })
  },

  remove: (id, userId) => {
    const { notifications } = get()
    const updatedNotifications = notifications.filter(n => n.id !== id)
    const unreadCount = updatedNotifications.filter(n => !n.is_read).length
    
    set({
      notifications: updatedNotifications,
      unreadCount
    })
  },

  clear: (userId) => {
    set({
      notifications: [],
      unreadCount: 0
    })
  },

  setNotifications: (newNotifications) => {
    const unreadCount = newNotifications.filter(n => !n.is_read).length
    set({
      notifications: newNotifications,
      unreadCount
    })
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count })
  }
}))

export const notify = (notification: Omit<AppNotification, 'id' | 'created_at' | 'user_id' | 'is_read'>) => {
  useNotificationStore.getState().add(notification)
}
