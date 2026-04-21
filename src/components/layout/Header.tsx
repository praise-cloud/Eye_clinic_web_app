import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, LogOut, Settings, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { profile } = useAuthStore()
  const { logout } = useAuth()
  const accent = getRoleAccent(profile?.role ?? 'assistant')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-3 sm:px-5 flex-shrink-0 safe-area-pt">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: accent }}
            >
              {getInitials(profile?.full_name ?? 'U')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-none truncate max-w-[100px]">{profile?.full_name}</p>
              <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(profile?.role ?? '')}`}>
                {profile?.role}
              </span>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-card border rounded-lg shadow-lg z-50 py-1">
              <div className="px-3 py-2 border-b sm:hidden">
                <p className="text-xs font-medium truncate">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
              <Link to="/settings" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />Settings
              </Link>
              <button onClick={() => { setMenuOpen(false); logout() }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
