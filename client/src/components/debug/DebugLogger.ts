import { LogEntry } from '@shared/types';

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private static instance: DebugLogger;

  constructor(maxLogs = 1000) {
    this.maxLogs = maxLogs;
  }

  // Singleton pattern to ensure we have one logger throughout the app
  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  public log(message: string, type: 'info' | 'error' | 'warning' | 'debug' | 'success' = 'info', data?: any): void {
    const now = new Date();
    const timestamp = this.formatTimestamp(now);
    
    const logEntry: LogEntry = {
      timestamp,
      message,
      type,
      data
    };

    this.logs.push(logEntry);
    
    // Keep log size under control by removing oldest entries when exceeding maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Log to console as well
    this.consoleLog(logEntry);
    
    // Notify all listeners
    this.notifyListeners();
  }

  public getLogs(filter?: 'info' | 'error' | 'warning' | 'debug' | 'success' | 'all'): LogEntry[] {
    if (!filter || filter === 'all') {
      return [...this.logs];
    }
    
    return this.logs.filter(log => log.type === filter);
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
    console.clear();
    console.log('Debug logs cleared');
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public exportLogs(): string {
    const logText = this.logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`
    ).join('\n');
    
    return logText;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener([...this.logs]);
    }
  }

  private formatTimestamp(date: Date): string {
    return date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds().toString().padStart(3, '0');
  }

  private consoleLog(logEntry: LogEntry): void {
    const { timestamp, message, type, data } = logEntry;
    
    const styles = {
      info: 'color: #42a5f5',
      error: 'color: #f44336',
      warning: 'color: #ff9800',
      debug: 'color: #9e9e9e',
      success: 'color: #4caf50'
    };
    
    console.log(
      `%c[${timestamp}] [${type.toUpperCase()}] ${message}`, 
      styles[type],
      data || ''
    );
  }
}

export default DebugLogger;
