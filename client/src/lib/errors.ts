// Error handling utilities

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER: 'An error occurred. Please try again later.',
  VALIDATION: 'Invalid input. Please check your data and try again.',
  RATE_LIMIT: 'Too many requests. Please wait before trying again.',
  AUTH: 'Authentication failed. Please log in again.',
  DEFAULT: 'An unexpected error occurred. Please try again.'
} as const

export type ErrorType = keyof typeof ERROR_MESSAGES

export function getSecureErrorMessage(error: unknown, type?: ErrorType): string {
  if (type && ERROR_MESSAGES[type]) {
    return ERROR_MESSAGES[type]
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_MESSAGES.NOT_FOUND
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return ERROR_MESSAGES.AUTH
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_MESSAGES.VALIDATION
    }
    
    if (message.includes('rate limit') || message.includes('too many')) {
      return ERROR_MESSAGES.RATE_LIMIT
    }
  }

  return ERROR_MESSAGES.DEFAULT
}

export function getAutoSecureErrorMessage(error: unknown): string {
  return getSecureErrorMessage(error)
}
