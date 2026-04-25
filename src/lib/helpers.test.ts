import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelative,
  formatSmartDate,
  formatCurrency,
  formatPhone,
  truncate,
  capitalize,
  formatAppointmentType,
  formatStatus,
  calculateAge,
  getInitials,
  debounce,
  generatePatientNumber,
  isValidEmail,
  isValidPhone,
  getRoleDisplayName,
  getAppointmentStatusColor,
} from '../lib/helpers'

describe('formatDate', () => {
  it('formats date string', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 15, 2024')
  })

  it('formats Date object', () => {
    expect(formatDate(new Date('2024-03-15'))).toBe('Mar 15, 2024')
  })
})

describe('formatDateTime', () => {
  it('formats datetime string', () => {
    expect(formatDateTime('2024-03-15T10:30:00')).toBe('Mar 15, 2024 10:30 AM')
  })
})

describe('formatTime', () => {
  it('formats time string', () => {
    expect(formatTime('2024-03-15T10:30:00')).toBe('10:30 AM')
  })
})

describe('formatRelative', () => {
  it('returns relative time', () => {
    const result = formatRelative(new Date())
    expect(result).toBeTruthy()
  })
})

describe('formatSmartDate', () => {
  it('returns Today for today', () => {
    expect(formatSmartDate(new Date())).toBe('Today')
  })

  it('returns Yesterday for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatSmartDate(yesterday)).toBe('Yesterday')
  })

  it('returns formatted date for older dates', () => {
    expect(formatSmartDate('2024-01-01')).toBe('Jan 1')
  })
})

describe('formatCurrency', () => {
  it('formats NGN currency', () => {
    expect(formatCurrency(5000)).toBe('₦5,000')
  })

  it('formats with custom currency (locale-aware)', () => {
    const result = formatCurrency(5000, 'USD')
    expect(result).toContain('5,000')
  })
})

describe('formatPhone', () => {
  it('formats Nigerian phone number', () => {
    expect(formatPhone('08012345678')).toBe('0801 234 5678')
  })

  it('returns unchanged for invalid input', () => {
    expect(formatPhone('invalid')).toBe('invalid')
    expect(formatPhone('')).toBe('')
  })
})

describe('truncate', () => {
  it('truncates long text', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('returns unchanged for short text', () => {
    expect(truncate('hi', 10)).toBe('hi')
  })
})

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })
})

describe('formatAppointmentType', () => {
  it('formats type with underscores', () => {
    expect(formatAppointmentType('eye_exam')).toBe('Eye Exam')
  })
})

describe('formatStatus', () => {
  it('formats status with underscores', () => {
    expect(formatStatus('no_show')).toBe('No Show')
  })
})

describe('calculateAge', () => {
  it('calculates age correctly', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 30)
    expect(calculateAge(dob.toISOString())).toBe(30)
  })
})

describe('getInitials', () => {
  it('returns single letter for one word', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('returns two letters for two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?')
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('only calls once for multiple calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('generatePatientNumber', () => {
  it('generates patient number', () => {
    const result = generatePatientNumber()
    expect(result).toMatch(/^PT-[A-Z0-9]{7}$/)
  })
})

describe('isValidEmail', () => {
  it('validates correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('validates Nigerian phone', () => {
    expect(isValidPhone('08012345678')).toBe(true)
  })

  it('rejects invalid phone', () => {
    expect(isValidPhone('12345678')).toBe(false)
    expect(isValidPhone('090123456789')).toBe(false)
  })
})

describe('getRoleDisplayName', () => {
  it('returns display name for roles', () => {
    expect(getRoleDisplayName('doctor')).toBe('Doctor')
    expect(getRoleDisplayName('frontdesk')).toBe('Frontdesk')
    expect(getRoleDisplayName('admin')).toBe('Admin/Accounts')
    expect(getRoleDisplayName('manager')).toBe('Manager')
  })

  it('capitalizes unknown role', () => {
    expect(getRoleDisplayName('unknown')).toBe('Unknown')
  })
})

describe('getAppointmentStatusColor', () => {
  it('returns color for scheduled', () => {
    const result = getAppointmentStatusColor('scheduled')
    expect(result.bg).toBe('bg-blue-50 dark:bg-blue-950')
  })

  it('returns default for unknown status', () => {
    const result = getAppointmentStatusColor('unknown')
    expect(result.bg).toBe('bg-blue-50 dark:bg-blue-950')
  })
})