import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  error?: any;
}

class Logger {
  private logDir: string;
  private currentLogFile: string;
  private errorLogFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    
    const date = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.logDir, `app-${date}.log`);
    this.errorLogFile = path.join(this.logDir, `error-${date}.log`);
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(level: string, message: string, data?: any, error?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };
  }

  private writeToFile(filePath: string, entry: LogEntry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private log(level: string, message: string, data?: any, error?: any) {
    const entry = this.formatLogEntry(level, message, data, error);
    
    // コンソールに出力
    const consoleMessage = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    if (error) {
      console.error(consoleMessage, data, error);
    } else if (level === 'warn') {
      console.warn(consoleMessage, data);
    } else if (level === 'info') {
      console.log(consoleMessage, data);
    } else {
      console.log(consoleMessage, data);
    }

    // ファイルに出力
    this.writeToFile(this.currentLogFile, entry);
    
    // エラーログは別ファイルにも出力
    if (level === 'error' || level === 'fatal') {
      this.writeToFile(this.errorLogFile, entry);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any, error?: any) {
    this.log('error', message, data, error);
  }

  fatal(message: string, data?: any, error?: any) {
    this.log('fatal', message, data, error);
  }

  // API用のログメソッド
  apiRequest(method: string, url: string, userId?: string) {
    this.info('API Request', { method, url, userId });
  }

  apiResponse(method: string, url: string, statusCode: number, responseTime: number) {
    this.info('API Response', { method, url, statusCode, responseTime });
  }

  // データベース用のログメソッド
  dbQuery(query: string, params?: any[], duration?: number) {
    this.debug('Database Query', { query, params, duration });
  }

  dbError(query: string, params?: any[], error?: any) {
    this.error('Database Error', { query, params }, error);
  }

  // 認証用のログメソッド
  authAttempt(email: string, success: boolean, error?: any) {
    if (success) {
      this.info('Authentication Success', { email });
    } else {
      this.error('Authentication Failed', { email }, error);
    }
  }

  // セキュリティ用のログメソッド
  securityEvent(event: string, details: any) {
    this.warn('Security Event', { event, details });
  }
}

// シングルトンインスタンス
export const logger = new Logger();

// 便利な関数
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any, error?: any) => logger.error(message, data, error),
  fatal: (message: string, data?: any, error?: any) => logger.fatal(message, data, error),
  
  // API用
  apiRequest: (method: string, url: string, userId?: string) => logger.apiRequest(method, url, userId),
  apiResponse: (method: string, url: string, statusCode: number, responseTime: number) => 
    logger.apiResponse(method, url, statusCode, responseTime),
  
  // データベース用
  dbQuery: (query: string, params?: any[], duration?: number) => logger.dbQuery(query, params, duration),
  dbError: (query: string, params?: any[], error?: any) => logger.dbError(query, params, error),
  
  // 認証用
  authAttempt: (email: string, success: boolean, error?: any) => logger.authAttempt(email, success, error),
  
  // セキュリティ用
  securityEvent: (event: string, details: any) => logger.securityEvent(event, details)
}; 