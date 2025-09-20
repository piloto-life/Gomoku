// Centralized logging utility for the Gomoku frontend application
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel = LogLevel.DEBUG;
  private sessionId: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.logLevel = this.getLogLevelFromEnv();
    console.log(`🚀 Logger initialized - Session ID: ${this.sessionId}`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.REACT_APP_LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addToBuffer(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private createLogEntry(level: LogLevel, category: string, message: string, data?: any): LogEntry {
    const userId = localStorage.getItem('userId') || undefined;
    return {
      timestamp: this.formatTimestamp(),
      level,
      category,
      message,
      data,
      userId,
      sessionId: this.sessionId,
    };
  }

  private outputLog(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || '');
        break;
    }
  }

  public debug(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, category, message, data);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  public info(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, category, message, data);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  public warn(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, category, message, data);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  public error(category: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, category, message, data);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  // Specialized logging methods for different areas
  public apiRequest(method: string, url: string, data?: any): void {
    this.info('API_REQUEST', `${method.toUpperCase()} ${url}`, {
      method,
      url,
      requestData: data,
      timestamp: this.formatTimestamp(),
    });
  }

  public apiResponse(method: string, url: string, status: number, data?: any, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method.toUpperCase()} ${url} - ${status} ${duration ? `(${duration}ms)` : ''}`;
    
    if (level === LogLevel.ERROR) {
      this.error('API_RESPONSE', message, {
        method,
        url,
        status,
        responseData: data,
        duration,
        timestamp: this.formatTimestamp(),
      });
    } else {
      this.info('API_RESPONSE', message, {
        method,
        url,
        status,
        responseData: data,
        duration,
        timestamp: this.formatTimestamp(),
      });
    }
  }

  public navigation(from: string, to: string): void {
    this.info('NAVIGATION', `Navigating from ${from} to ${to}`, {
      from,
      to,
      timestamp: this.formatTimestamp(),
    });
  }

  public websocketConnect(url: string): void {
    this.info('WEBSOCKET', `Connecting to ${url}`, {
      url,
      timestamp: this.formatTimestamp(),
    });
  }

  public websocketMessage(type: 'SEND' | 'RECEIVE', messageType: string, data?: any): void {
    this.debug('WEBSOCKET', `${type} message: ${messageType}`, {
      direction: type,
      messageType,
      data,
      timestamp: this.formatTimestamp(),
    });
  }

  public websocketError(error: string, url?: string): void {
    this.error('WEBSOCKET', `WebSocket error: ${error}`, {
      error,
      url,
      timestamp: this.formatTimestamp(),
    });
  }

  public userAction(action: string, component: string, data?: any): void {
    this.info('USER_ACTION', `${action} in ${component}`, {
      action,
      component,
      data,
      timestamp: this.formatTimestamp(),
    });
  }

  public componentMount(componentName: string, props?: any): void {
    this.debug('COMPONENT', `${componentName} mounted`, {
      componentName,
      props,
      timestamp: this.formatTimestamp(),
    });
  }

  public componentUnmount(componentName: string): void {
    this.debug('COMPONENT', `${componentName} unmounted`, {
      componentName,
      timestamp: this.formatTimestamp(),
    });
  }

  public stateChange(component: string, oldState: any, newState: any): void {
    this.debug('STATE_CHANGE', `State change in ${component}`, {
      component,
      oldState,
      newState,
      timestamp: this.formatTimestamp(),
    });
  }

  // Get logs for debugging or analytics
  public getLogs(category?: string, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    return filteredLogs;
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public clearLogs(): void {
    this.logs = [];
    this.info('LOGGER', 'Logs cleared');
  }

  public getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
export const logger = new Logger();

// Export default instance
export default logger;