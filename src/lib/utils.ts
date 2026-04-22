import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Use browser's local timezone for all date/time formatting
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ,
    })
}

export function formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
}

export function formatTimeFromDate(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-NG', {
        hour: '2-digit', minute: '2-digit', timeZone: TZ,
    })
}

// Legacy — kept for compatibility
export function formatTime(time: string): string {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${m} ${ampm}`
}

export function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getRoleColor(role: string): string {
    const colors: Record<string, string> = {
        doctor: 'bg-blue-100 text-blue-700',
        assistant: 'bg-teal-100 text-teal-700',
        admin: 'bg-indigo-100 text-indigo-700',
        accountant: 'bg-emerald-100 text-emerald-700',
    }
    return colors[role] ?? 'bg-gray-100 text-gray-700'
}

export function getRoleAccent(role: string): string {
    const accents: Record<string, string> = {
        doctor: '#1D7FE8',
        assistant: '#0D9488',
        admin: '#4F46E5',
        accountant: '#059669',
    }
    return accents[role] ?? '#1D7FE8'
}
