import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

// Format date and time
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

// Format time only
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

// Format relative time (e.g., "2 hours ago")
export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// Smart date label (Today, Yesterday, or date)
export function formatSmartDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

// Format currency
export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format phone number
export function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (!text || text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Capitalize first letter
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Format appointment type
export function formatAppointmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Format status badge
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Calculate age from DOB
export function calculateAge(dob: string): number {
  const birthDate = parseISO(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate patient number
export function generatePatientNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PT-${timestamp.slice(-4)}${random}`
}

// Validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validate phone (Nigerian)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 11 && cleaned.startsWith('0')
}

// Get role display name
export function getRoleDisplayName(role: string): string {
  const names: Record<string, string> = {
    doctor: 'Doctor',
    frontdesk: 'Frontdesk',
    admin: 'Admin/Accounts',
    manager: 'Manager',
  }
  return names[role] || capitalize(role)
}

// Get appointment status color
export function getAppointmentStatusColor(status: string): {
  bg: string
  text: string
  border: string
} {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    scheduled: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-600 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800'
    },
    confirmed: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-600 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800'
    },
    completed: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-500 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-700'
    },
    cancelled: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-600 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800'
    },
    no_show: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      text: 'text-orange-600 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800'
    },
  }
  return colors[status] || colors.scheduled
}

// Export to CSV helper
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val === null || val === undefined ? '' : String(val)
        return str.includes(',') ? `"${str}"` : str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}