import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search, Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { Avatar } from '../ui/Avatar'

interface HeaderProps {
  onMenuClick?: () => void
  onSearch?: (term: string) => void
}

export function Header({ onMenuClick, onSearch }: HeaderProps) {
  const { user } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchTerm)
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    assistant: 'bg-green-100 text-green-700',
    accountant: 'bg-yellow-100 text-yellow-700'
  }

  return (
    <header className="bg-white border-b border-surface-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </form>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-surface-200 z-50">
                <div className="p-3 border-b border-surface-200">
                  <h3 className="font-semibold text-surface-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 text-center text-surface-500 text-sm">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100"
            >
              <Avatar 
                firstName={user?.first_name} 
                lastName={user?.last_name}
                size="sm"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-surface-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className={`text-xs capitalize ${roleColors[user?.role || 'assistant']}`}>
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-surface-200 z-50">
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-surface-700 hover:bg-surface-50"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-surface-700 hover:bg-surface-50"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </Link>
                <hr className="my-1" />
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-surface-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}