/**
 * Priority-based buffering system for torrent streaming
 */

import { logger } from '../../utils/logger';

export interface BufferSegment {
  start: number;
  end: number;
  priority: number;
  downloaded: boolean;
  requested: boolean;
}

export interface BufferingStrategy {
  name: string;
  getNextSegment: (segments: BufferSegment[], currentTime: number, bufferAhead: number) => BufferSegment | null;
}

export interface PriorityBufferingOptions {
  bufferSize: number; // Size of buffer window in seconds
  bufferAhead: number; // How far ahead to buffer in seconds
  maxConcurrentRequests: number; // Maximum concurrent piece requests
  strategy: 'linear' | 'priority' | 'adaptive';
}

export class PriorityBuffer {
  private segments: BufferSegment[] = [];
  private activeRequests: Set<string> = new Set();
  private options: PriorityBufferingOptions;
  private strategy: BufferingStrategy;

  constructor(
    private fileSize: number,
    private pieceLength: number,
    options: Partial<PriorityBufferingOptions> = {}
  ) {
    this.options = {
      bufferSize: 30, // 30 seconds
      bufferAhead: 60, // 1 minute ahead
      maxConcurrentRequests: 5,
      strategy: 'priority',
      ...options
    };

    this.strategy = this.createStrategy(this.options.strategy);
    this.initializeSegments();
  }

  /**
   * Initialize buffer segments
   */
  private initializeSegments(): void {
    const totalPieces = Math.ceil(this.fileSize / this.pieceLength);
    const segmentSize = Math.max(1, Math.floor(totalPieces / 100)); // Divide into ~100 segments

    for (let i = 0; i < totalPieces; i += segmentSize) {
      const end = Math.min(i + segmentSize, totalPieces);
      this.segments.push({
        start: i,
        end: end - 1,
        priority: 0,
        downloaded: false,
        requested: false
      });
    }

    logger.info('priority-buffer', 'Buffer segments initialized', {
      totalSegments: this.segments.length,
      totalPieces,
      segmentSize
    });
  }

  /**
   * Update buffer based on current playback position
   */
  updateBuffer(currentTime: number, _playbackRate: number = 1): void {
    const currentPiece = this.timeToPiece(currentTime);
    const bufferAheadPieces = this.timeToPiece(this.options.bufferAhead);

    // Update priorities based on distance from current position
    this.segments.forEach(segment => {
      const distance = Math.abs(segment.start - currentPiece);
      segment.priority = this.calculatePriority(distance, bufferAheadPieces);
    });

    // Sort segments by priority (highest first)
    this.segments.sort((a, b) => b.priority - a.priority);

    logger.debug('priority-buffer', 'Buffer priorities updated', {
      currentPiece,
      bufferAheadPieces,
      highPrioritySegments: this.segments.filter(s => s.priority > 50).length
    });
  }

  /**
   * Get next segment to download
   */
  getNextSegment(currentTime: number): BufferSegment | null {
    return this.strategy.getNextSegment(this.segments, currentTime, this.options.bufferAhead);
  }

  /**
   * Mark segment as downloaded
   */
  markDownloaded(start: number, end: number): void {
    const segment = this.findSegment(start);
    if (segment) {
      segment.downloaded = true;
      segment.requested = false;
      this.activeRequests.delete(`${start}-${end}`);

      logger.debug('priority-buffer', 'Segment downloaded', { start, end });
    }
  }

  /**
   * Mark segment as requested
   */
  markRequested(start: number, end: number): void {
    const segment = this.findSegment(start);
    if (segment && !segment.requested && !segment.downloaded) {
      segment.requested = true;
      this.activeRequests.add(`${start}-${end}`);
    }
  }

  /**
   * Check if segment can be requested
   */
  canRequestSegment(start: number, _end: number): boolean {
    const segment = this.findSegment(start);
    if (!segment) return false;

    return !segment.downloaded &&
           !segment.requested &&
           this.activeRequests.size < this.options.maxConcurrentRequests;
  }

  /**
   * Get buffer health (percentage of high-priority segments downloaded)
   */
  getBufferHealth(currentTime: number): number {
    const currentPiece = this.timeToPiece(currentTime);
    const relevantSegments = this.segments.filter(s =>
      Math.abs(s.start - currentPiece) <= this.timeToPiece(this.options.bufferAhead)
    );

    if (relevantSegments.length === 0) return 100;

    const downloadedCount = relevantSegments.filter(s => s.downloaded).length;
    return (downloadedCount / relevantSegments.length) * 100;
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): {
    totalSegments: number;
    downloadedSegments: number;
    requestedSegments: number;
    activeRequests: number;
    bufferHealth: number;
  } {
    return {
      totalSegments: this.segments.length,
      downloadedSegments: this.segments.filter(s => s.downloaded).length,
      requestedSegments: this.segments.filter(s => s.requested).length,
      activeRequests: this.activeRequests.size,
      bufferHealth: this.getBufferHealth(0) // Simplified, assumes current time is 0
    };
  }

  /**
   * Find segment containing the given piece range
   */
  private findSegment(start: number): BufferSegment | undefined {
    return this.segments.find(s => s.start <= start && s.end >= start);
  }

  /**
   * Calculate priority based on distance from current position
   */
  private calculatePriority(distance: number, bufferAheadPieces: number): number {
    if (distance === 0) return 100; // Current position has highest priority

    // Exponential decay based on distance
    const maxDistance = bufferAheadPieces * 2;
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const priority = Math.max(1, Math.floor(100 * Math.exp(-normalizedDistance * 3)));

    return priority;
  }

  /**
   * Convert time to piece number (simplified)
   */
  private timeToPiece(timeSeconds: number): number {
    // This is a simplified conversion - in reality you'd need to know the bitrate
    // For now, assume 1MB/s average bitrate
    const bytesPerSecond = 1024 * 1024; // 1MB/s
    const totalBytes = timeSeconds * bytesPerSecond;
    return Math.floor(totalBytes / this.pieceLength);
  }

  /**
   * Create buffering strategy
   */
  private createStrategy(strategyName: string): BufferingStrategy {
    switch (strategyName) {
      case 'linear':
        return {
          name: 'linear',
          getNextSegment: (_segments, _currentTime, _bufferAhead) => {
            // Download segments in order
            return _segments.find(s => !s.downloaded && !s.requested) || null;
          }
        };

      case 'priority':
        return {
          name: 'priority',
          getNextSegment: (_segments, _currentTime, _bufferAhead) => {
            // Download highest priority segments first
            return _segments.find(s => !s.downloaded && !s.requested) || null;
          }
        };

      case 'adaptive':
        return {
          name: 'adaptive',
          getNextSegment: (segments, currentTime, _bufferAhead) => {
            // Adaptive strategy based on buffer health
            const bufferHealth = this.getBufferHealth(currentTime);

            if (bufferHealth < 30) {
              // Buffer is low, prioritize immediate segments
              const immediateSegments = segments.filter(s =>
                Math.abs(s.start - this.timeToPiece(currentTime)) <= this.timeToPiece(10)
              );
              return immediateSegments.find(s => !s.downloaded && !s.requested) || null;
            } else {
              // Buffer is healthy, use priority-based selection
              return segments.find(s => !s.downloaded && !s.requested) || null;
            }
          }
        };

      default:
        return this.createStrategy('priority');
    }
  }
}