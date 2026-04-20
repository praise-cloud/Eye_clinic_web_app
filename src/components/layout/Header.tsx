import { Bell, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { profile } = useAuthStore()
  const accent = getRoleAccent(profile?.role ?? 'assistant')

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md hover:bg-accent"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            {getInitials(profile?.full_name ?? 'U')}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
            <span className={`text-xs capitalize px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(profile?.role ?? '')}`}>
              {profile?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
