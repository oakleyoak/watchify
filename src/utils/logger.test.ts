import { describe, it, expect, beforeEach } from 'vitest';
import { logger, logTorrentProgress, logStreamingEvent, formatBytes } from '../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      logger.info('test-category', 'Test message', { data: 'test' });

      const logs = logger.getLogs('test-category');
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].category).toBe('test-category');
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].data).toEqual({ data: 'test' });
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('test-category', 'Error occurred', error);

      const logs = logger.getLogs('test-category', 'error');
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].data).toBe(error);
    });

    it('should limit log entries', () => {
      // Log more than the max limit (1000)
      for (let i = 0; i < 1010; i++) {
        logger.info('test', `Message ${i}`);
      }

      const allLogs = logger.getLogs();
      expect(allLogs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      logger.info('cat1', 'message1');
      logger.warn('cat2', 'message2');
      logger.error('cat1', 'message3');
    });

    it('should return all logs when no filter provided', () => {
      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
    });

    it('should filter by category', () => {
      const logs = logger.getLogs('cat1');
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.category === 'cat1')).toBe(true);
    });

    it('should filter by level', () => {
      const logs = logger.getLogs(undefined, 'warn');
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
    });

    it('should filter by both category and level', () => {
      const logs = logger.getLogs('cat1', 'error');
      expect(logs).toHaveLength(1);
      expect(logs[0].category).toBe('cat1');
      expect(logs[0].level).toBe('error');
    });
  });

  describe('convenience functions', () => {
    it('should log torrent progress', () => {
      logTorrentProgress('test-hash', 0.5, 1024, 5);

      const logs = logger.getLogs('torrent-progress');
      expect(logs).toHaveLength(1);
      expect(logs[0].data).toEqual({
        infoHash: 'test-hash',
        progress: 0.5,
        downloadSpeed: 1024,
        peers: 5
      });
    });

    it('should log streaming events', () => {
      logStreamingEvent('test event', { custom: 'data' });

      const logs = logger.getLogs('streaming');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('test event');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });
});