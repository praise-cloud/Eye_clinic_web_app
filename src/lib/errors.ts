/**
 * Secure error message utilities
 * Prevents information disclosure by providing generic error messages to users
 */

// Generic error messages that don't expose internal system details
const GENERIC_ERROR_MESSAGES = {
  AUTH: 'Authentication failed. Please check your credentials and try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  PERMISSION: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER: 'An error occurred. Please try again later.',
  VALIDATION: 'Invalid input. Please check your data and try again.',
  RATE_LIMIT: 'Too many requests. Please wait before trying again.',
  DEFAULT: 'An unexpected error occurred. Please try again.'
} as const;

type ErrorType = keyof typeof GENERIC_ERROR_MESSAGES;

/**
 * Get a secure error message for users
 * @param error - The original error object
 * @param type - Type of error to return generic message for
 * @returns Secure error message for user display
 */
export function getSecureErrorMessage(error: unknown, type: ErrorType = 'DEFAULT'): string {
  // Log the actual error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error('Original error:', error);
  }
  
  return GENERIC_ERROR_MESSAGES[type];
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('invalid') || 
           msg.includes('unauthorized') || 
           msg.includes('forbidden') ||
           msg.includes('credentials') ||
           msg.includes('auth');
  }
  return false;
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || 
           msg.includes('fetch') ||
           msg.includes('connection') ||
           msg.includes('timeout');
  }
  return false;
}

/**
 * Check if error is permission related
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('permission') || 
           msg.includes('forbidden') ||
           msg.includes('unauthorized') ||
           msg.includes('access denied');
  }
  return false;
}

/**
 * Automatically determine error type and return appropriate secure message
 */
export function getAutoSecureErrorMessage(error: unknown): string {
  if (isAuthError(error)) return getSecureErrorMessage(error, 'AUTH');
  if (isNetworkError(error)) return getSecureErrorMessage(error, 'NETWORK');
  if (isPermissionError(error)) return getSecureErrorMessage(error, 'PERMISSION');
  
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('not found') || msg.includes('404')) {
      return getSecureErrorMessage(error, 'NOT_FOUND');
    }
    if (msg.includes('validation') || msg.includes('invalid')) {
      return getSecureErrorMessage(error, 'VALIDATION');
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return getSecureErrorMessage(error, 'RATE_LIMIT');
    }
  }
  
  return getSecureErrorMessage(error, 'SERVER');
}
