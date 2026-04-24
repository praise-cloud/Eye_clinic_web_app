import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
    id: string
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
}

interface UIState {
    sidebarOpen: boolean
    theme: 'light' | 'dark'
    toasts: Toast[]
    setSidebarOpen: (open: boolean) => void
    toggleSidebar: () => void
    setTheme: (theme: 'light' | 'dark') => void
    toggleTheme: () => void
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

export const useUIStore = create<UIState>()(persist((set) => ({
    sidebarOpen: true,
    theme: 'light',
    toasts: [],
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
    },
    toggleTheme: () => set((s) => {
        const newTheme = s.theme === 'light' ? 'dark' : 'light'
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
        return { theme: newTheme }
    }),
    addToast: (toast) => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000)
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}), {
    name: 'ui-storage',
    partialize: (state) => ({ theme: state.theme }),
}))
