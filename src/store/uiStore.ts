import { create } from 'zustand'

interface Toast {
    id: string
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
}

interface UIState {
    sidebarOpen: boolean
    toasts: Toast[]
    setSidebarOpen: (open: boolean) => void
    toggleSidebar: () => void
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    toasts: [],
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    addToast: (toast) => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000)
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
