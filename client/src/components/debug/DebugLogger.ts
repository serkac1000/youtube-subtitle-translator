/**
 * DebugLogger.ts
 * Utility for managing debug logs in the browser environment
 */

// Levels for filtering logs
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Configuration for the logger
interface LoggerConfig {
  // Whether logging is enabled
  enabled: boolean;
  // Minimum log level to display
  minLevel: LogLevel;
  // Whether to persist logs in localStorage
  persistLogs: boolean;
  // Maximum number of logs to keep in memory
  maxLogEntries: number;
}

// Structure for a log entry
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  enabled: true,
  minLevel: 'info',
  persistLogs: true,
  maxLogEntries: 1000
};

// Map log levels to numeric values for comparison
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Debug logger for the application
 * Provides consistent logging with categories and persistence
 */
class DebugLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private listeners: Array<(entry: LogEntry) => void> = [];
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadLogsFromStorage();
    
    // Listen for unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('global', 'Unhandled error', { 
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.error('global', 'Unhandled promise rejection', { 
          reason: event.reason
        });
      });
    }
  }
  
  /**
   * Log a debug message
   */
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }
  
  /**
   * Log an info message
   */
  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }
  
  /**
   * Log an error message
   */
  error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }
  
  /**
   * Get all logs, optionally filtered by level
   */
  getLogs(minLevel?: LogLevel): LogEntry[] {
    if (!minLevel) return [...this.logs];
    
    const minPriority = LOG_LEVEL_PRIORITY[minLevel];
    return this.logs.filter(log => LOG_LEVEL_PRIORITY[log.level] <= minPriority);
  }
  
  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    if (this.config.persistLogs && typeof localStorage !== 'undefined') {
      localStorage.removeItem('debugLogs');
    }
  }
  
  /**
   * Add a listener for new log entries
   */
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a listener
   */
  removeListener(listener: (entry: LogEntry) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
  
  /**
   * Internal method to handle logging
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.config.enabled) return;
    
    // Check if we should log this level
    if (LOG_LEVEL_PRIORITY[level] > LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };
    
    // Add to logs array
    this.logs.push(entry);
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(this.logs.length - this.config.maxLogEntries);
    }
    
    // Log to console
    this.logToConsole(entry);
    
    // Notify listeners
    this.notifyListeners(entry);
    
    // Persist logs if enabled
    if (this.config.persistLogs) {
      this.saveLogsToStorage();
    }
  }
  
  /**
   * Log to browser console with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const logPrefix = `%c[${entry.category}]%c ${entry.message}`;
    
    let categoryStyle = 'color: blue; font-weight: bold;';
    let messageStyle = '';
    
    switch (entry.level) {
      case 'error':
        console.error(logPrefix, categoryStyle, 'color: red', entry.data || '');
        break;
      case 'warn':
        console.warn(logPrefix, categoryStyle, 'color: orange', entry.data || '');
        break;
      case 'info':
        console.info(logPrefix, categoryStyle, messageStyle, entry.data || '');
        break;
      case 'debug':
        console.debug(logPrefix, categoryStyle, 'color: gray', entry.data || '');
        break;
    }
  }
  
  /**
   * Notify all listeners of a new log entry
   */
  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });
  }
  
  /**
   * Save logs to localStorage
   */
  private saveLogsToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('debugLogs', JSON.stringify(this.logs));
    } catch (err) {
      console.error('Error saving logs to storage:', err);
    }
  }
  
  /**
   * Load logs from localStorage
   */
  private loadLogsFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const storedLogs = localStorage.getItem('debugLogs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
    } catch (err) {
      console.error('Error loading logs from storage:', err);
    }
  }
}

// Create a singleton instance
export const logger = new DebugLogger();

// Convenience export for console override
export function setupConsoleOverride(): void {
  if (typeof window !== 'undefined') {
    // Save original console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override console methods
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      logger.info('console', args[0], args.slice(1));
    };
    
    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      logger.info('console', args[0], args.slice(1));
    };
    
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      logger.warn('console', args[0], args.slice(1));
    };
    
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      logger.error('console', args[0], args.slice(1));
    };
    
    console.debug = (...args: any[]) => {
      originalConsole.debug(...args);
      logger.debug('console', args[0], args.slice(1));
    };
  }
}