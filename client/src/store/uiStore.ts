import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  notifications: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleNotifications: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'light',
  sidebarOpen: false,
  notifications: false,

  toggleTheme: () => {
    const { theme } = get()
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    set({ theme: nextTheme })
  },

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
}))
