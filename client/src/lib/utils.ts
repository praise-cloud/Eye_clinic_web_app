import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Profile } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format time
export function formatTime(time: string | Date): string {
  const d = new Date(time)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  
  if (isToday) {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  }) + ' ' + d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get role color
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    manager: 'bg-blue-100 text-blue-800 border-blue-200',
    doctor: 'bg-green-100 text-green-800 border-green-200',
    frontdesk: 'bg-purple-100 text-purple-800 border-purple-200'
  }
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Get role accent color
export function getRoleAccent(role: string): string {
  const accents: Record<string, string> = {
    admin: 'bg-red-500',
    manager: 'bg-blue-500',
    doctor: 'bg-green-500',
    frontdesk: 'bg-purple-500'
  }
  return accents[role] || 'bg-gray-500'
}

// Normalize user role
export function normalizeUserRole(role: string): Profile['role'] {
  const normalized = role.toLowerCase()
  const validRoles = ['admin', 'manager', 'doctor', 'frontdesk']
  return validRoles.includes(normalized) ? normalized as Profile['role'] : 'frontdesk'
}

// Build fallback profile
export function buildFallbackProfile(email: string, name?: string): Partial<Profile> {
  return {
    email,
    full_name: name || email.split('@')[0],
    role: 'frontdesk',
    is_active: true
  }
}

// Get role dashboard path
export function getRoleDashboardPath(user: Partial<Profile>): string {
  const rolePaths = {
    admin: '/admin',
    manager: '/manager',
    doctor: '/doctor',
    frontdesk: '/frontdesk'
  }
  return rolePaths[user.role || 'frontdesk']
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Check if date is today
export function isToday(date: string | Date): boolean {
  const today = new Date()
  const checkDate = new Date(date)
  return checkDate.toDateString() === today.toDateString()
}

// Check if date is in the past
export function isPast(date: string | Date): boolean {
  return new Date(date) < new Date()
}

// Check if date is in the future
export function isFuture(date: string | Date): boolean {
  return new Date(date) > new Date()
}

// Get relative time
export function getRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return formatDate(date)
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
