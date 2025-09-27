/**
 * Centralized logging system for torrent streaming operations
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogEntry['level'], category: string, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with appropriate level
    const consoleMethod = level === 'error' ? 'error' :
                         level === 'warn' ? 'warn' :
                         level === 'debug' ? 'debug' : 'log';

    console[consoleMethod](`[${category}] ${message}`, data || '');
  }

  info(category: string, message: string, data?: Record<string, unknown>) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: Record<string, unknown>) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: Record<string, unknown>) {
    this.log('error', category, message, data);
  }

  debug(category: string, message: string, data?: Record<string, unknown>) {
    this.log('debug', category, message, data);
  }

  getLogs(category?: string, level?: LogEntry['level']): LogEntry[] {
    let filtered = this.logs;

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Convenience functions for common logging scenarios
export const logTorrentProgress = (infoHash: string, progress: number, downloadSpeed: number, peers: number) => {
  logger.info('torrent-progress', `Progress: ${(progress * 100).toFixed(1)}%, Speed: ${formatBytes(downloadSpeed)}/s, Peers: ${peers}`, {
    infoHash,
    progress,
    downloadSpeed,
    peers
  });
};

export const logStreamingEvent = (event: string, data?: Record<string, unknown>) => {
  logger.info('streaming', event, data);
};

export const logError = (category: string, error: Error | string, context?: Record<string, unknown>) => {
  const message = error instanceof Error ? error.message : error;
  logger.error(category, message, { error: error instanceof Error ? error.stack : error, ...context });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};