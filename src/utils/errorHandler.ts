/**
 * Centralized error handling and retry logic for torrent streaming operations
 */

import { logger, logError } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export interface ErrorHandlerOptions {
  category: string;
  retryOptions?: Partial<RetryOptions>;
  fallback?: () => void;
}

export class StreamingError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: string,
    public recoverable: boolean = false,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StreamingError';
  }
}

export class TorrentError extends StreamingError {
  constructor(message: string, code: string, recoverable: boolean = false, context?: Record<string, unknown>) {
    super(message, code, 'torrent', recoverable, context);
  }
}

export class NetworkError extends StreamingError {
  constructor(message: string, code: string, recoverable: boolean = true, context?: Record<string, unknown>) {
    super(message, code, 'network', recoverable, context);
  }
}

export class HLSStreamingError extends StreamingError {
  constructor(message: string, code: string, recoverable: boolean = true, context?: Record<string, unknown>) {
    super(message, code, 'hls', recoverable, context);
  }
}

export const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  category: string = 'operation'
): Promise<T> => {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxAttempts) {
        logError(category, `Operation failed after ${opts.maxAttempts} attempts`, {
          attempt,
          error: lastError.message
        });
        throw lastError;
      }

      const delay = Math.min(opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1), opts.maxDelayMs);

      logger.warn(category, `Attempt ${attempt} failed, retrying in ${delay}ms`, {
        attempt,
        error: lastError.message,
        delay
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

export const handleStreamingError = (
  error: Error | StreamingError,
  options: ErrorHandlerOptions
): void => {
  const streamingError = error instanceof StreamingError ? error : new StreamingError(
    error.message,
    'UNKNOWN_ERROR',
    options.category,
    false,
    { originalError: error }
  );

  logError(options.category, streamingError.message, {
    code: streamingError.code,
    recoverable: streamingError.recoverable,
    context: streamingError.context
  });

  // Execute fallback if provided and error is not recoverable
  if (!streamingError.recoverable && options.fallback) {
    logger.info(options.category, 'Executing fallback operation');
    try {
      options.fallback();
    } catch (fallbackError) {
      logError(options.category, 'Fallback operation failed', fallbackError);
    }
  }
};

export const isRecoverableError = (error: Error | StreamingError): boolean => {
  if (error instanceof StreamingError) {
    return error.recoverable;
  }

  // Check for common recoverable network errors
  const recoverablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /ECONNRESET/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i
  ];

  return recoverablePatterns.some(pattern => pattern.test(error.message));
};

export const createErrorHandler = (defaultCategory: string) => ({
  handle: (error: Error | StreamingError, options?: Partial<ErrorHandlerOptions>) =>
    handleStreamingError(error, { category: defaultCategory, ...options }),

  retry: <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ) => retryWithBackoff(operation, options, defaultCategory),

  isRecoverable: (error: Error | StreamingError) => isRecoverableError(error)
});