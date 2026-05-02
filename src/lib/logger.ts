/**
 * Secure logging utility
 * Only logs in development environment to prevent information disclosure in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDev: boolean;

  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors to external services
    if (!this.isDev) {
      return level === 'error';
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    if (this.isDev) {
      // Development: log to console with appropriate level
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    } else {
      // Production: send to external logging service
      this.sendToExternalService(level, message, data);
    }
  }

  private async sendToExternalService(level: LogLevel, message: string, data?: any): Promise<void> {
    try {
      // In a real application, you would send this to a service like:
      // - Sentry, LogRocket, Datadog, etc.
      // - Your own logging endpoint
      // For now, we'll just store in memory for debugging
      
      const logEntry: LogEntry = {
        level,
        message,
        data,
        timestamp: new Date().toISOString()
      };

      // Store in sessionStorage for debugging (limited size)
      const existingLogs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 50 logs to prevent memory issues
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      sessionStorage.setItem('app_logs', JSON.stringify(existingLogs));
    } catch (error) {
      // Silently fail to avoid infinite logging loops
    }
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  // Get production logs for debugging
  getProductionLogs(): LogEntry[] {
    try {
      return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear production logs
  clearProductionLogs(): void {
    sessionStorage.removeItem('app_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logError = (message: string, data?: any) => logger.error(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
