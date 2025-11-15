/**
 * Logging Utility
 * 
 * Comprehensive logging system for the Member App with:
 * - Multiple log levels (debug, info, warn, error)
 * - File/function tracking for better debugging
 * - Environment-aware logging (dev/prod)
 * - Formatted output for readability
 * - Error stack traces
 * 
 * Usage:
 * import { logger } from '../utils/logger';
 * logger.debug('ProfileScreen', 'User profile loaded', { userId: '123' });
 * logger.error('ProfileScreen', 'Failed to load profile', error);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  file: string;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500; // Keep last 500 logs in memory
  private logLevel: LogLevel = 'debug'; // Always use debug in development

  /**
   * Set the minimum log level to display
   * @param level - Minimum level to log (debug, info, warn, error)
   */
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Debug level logging (lowest priority)
   * @param file - File or component name where log originated
   * @param message - Log message
   * @param data - Optional data to log
   */
  debug(file: string, message: string, data?: any) {
    this.log('debug', file, message, data);
  }

  /**
   * Info level logging (general information)
   * @param file - File or component name where log originated
   * @param message - Log message
   * @param data - Optional data to log
   */
  info(file: string, message: string, data?: any) {
    this.log('info', file, message, data);
  }

  /**
   * Warn level logging (warning conditions)
   * @param file - File or component name where log originated
   * @param message - Log message
   * @param data - Optional data to log
   */
  warn(file: string, message: string, data?: any) {
    this.log('warn', file, message, data);
  }

  /**
   * Error level logging (highest priority)
   * @param file - File or component name where log originated
   * @param message - Log message
   * @param error - Error object or additional data
   */
  error(file: string, message: string, error?: any) {
    const data = error instanceof Error ? { message: error.message } : error;
    const stack = error instanceof Error ? error.stack : undefined;
    this.log('error', file, message, data, stack);
  }

  /**
   * Internal logging implementation
   */
  private log(
    level: LogLevel,
    file: string,
    message: string,
    data?: any,
    stack?: string
  ) {
    // Only log if level is equal to or higher than configured level
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      file,
      message,
      data,
      stack,
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Format and output to console
    this.outputToConsole(logEntry);
  }

  /**
   * Check if log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.logLevel);
    const targetIndex = levels.indexOf(level);
    return targetIndex >= currentIndex;
  }

  /**
   * Format and output log to console
   */
  private outputToConsole(entry: LogEntry) {
    const { timestamp, level, file, message, data, stack } = entry;
    const levelEmoji = this.getLevelEmoji(level);
    const levelColor = this.getLevelColor(level);

    // Build the main log message
    const prefix = `${levelEmoji} [${timestamp.split('T')[1]}] ${file}`;
    const styles = [
      `color: ${levelColor}; font-weight: bold;`,
      'color: inherit;',
    ];

    // Output main message
    console.log(`%c${prefix}%c: ${message}`, ...styles);

    // Output data if present
    if (data) {
      console.log('  Data:', data);
    }

    // Output stack trace if present
    if (stack) {
      console.log('  Stack:', stack);
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };
    return emojis[level];
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      debug: '#666666',
      info: '#0066CC',
      warn: '#FF9900',
      error: '#CC0000',
    };
    return colors[level];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for convenience
export type { LogEntry };
