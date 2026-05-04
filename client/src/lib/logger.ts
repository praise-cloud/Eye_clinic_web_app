// Logging utilities

export function logError(context: string, error: unknown) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }
  
  console.error(`[${timestamp}] ${context}:`, errorInfo)
  
  // In development, you might want to send errors to a service
  if (import.meta?.env?.DEV) {
    console.error('Full error details:', error)
  }
}

export function logInfo(context: string, message: string) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${context}: ${message}`)
}

export function logWarning(context: string, message: string) {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] ${context}: ${message}`)
}
