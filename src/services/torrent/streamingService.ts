/**
 * Main streaming service that orchestrates torrent streaming operations
 */

import { WebTorrentClient, TorrentFile } from './webTorrentClient';
import { MagnetParser, MagnetInfo } from './magnetParser';
import { FileSelector, FileSelectionResult } from './fileSelector';
import { PriorityBuffer } from './priorityBuffer';
import { HLSStreamingService } from './hlsStreamingService';
import { logger, logStreamingEvent, logError } from '../../utils/logger';
import { StreamingError, NetworkError, createErrorHandler } from '../../utils/errorHandler';

export interface StreamMagnetOptions {
  autoplay?: boolean;
  preferredQuality?: 'lowest' | 'highest' | 'auto';
  bufferStrategy?: 'linear' | 'priority' | 'adaptive';
  maxBufferSize?: number;
  onProgress?: (progress: { downloaded: number; total: number; speed: number }) => void;
  onStatusChange?: (status: StreamStatus) => void;
}

export interface StreamStatus {
  state: 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'error';
  progress: number;
  downloadSpeed: number;
  peers: number;
  bufferHealth: number;
  currentQuality?: string;
  error?: string;
}

export class StreamingService {
  private webTorrentClient: WebTorrentClient;
  private hlsService: HLSStreamingService;
  private errorHandler = createErrorHandler('streaming-service');

  private currentMagnetInfo: MagnetInfo | null = null;
  private currentFile: TorrentFile | null = null;
  private priorityBuffer: PriorityBuffer | null = null;
  private status: StreamStatus = { state: 'idle', progress: 0, downloadSpeed: 0, peers: 0, bufferHealth: 0 };

  constructor() {
    this.webTorrentClient = new WebTorrentClient();
    this.hlsService = new HLSStreamingService();
  }

  /**
   * Stream a magnet URI - main entry point
   */
  async streamMagnet(
    magnetUri: string,
    videoElement: HTMLVideoElement,
    options: StreamMagnetOptions = {}
  ): Promise<void> {
    try {
      this.updateStatus({ state: 'connecting' });
      logStreamingEvent('Starting magnet stream', { magnetUri });

      // Parse magnet URI
      const magnetInfo = MagnetParser.parse(magnetUri);
      this.currentMagnetInfo = magnetInfo;

      // Add torrent
      const torrent = await this.webTorrentClient.addTorrent(magnetInfo, {
        onProgress: (progress) => this.handleTorrentProgress(progress)
      });

      // Select best video file
      const files = this.webTorrentClient.getTorrentFiles(magnetInfo.infoHash);
      const fileSelection = FileSelector.selectBestVideoFile(files);

      if (!fileSelection) {
        throw new StreamingError(
          'No suitable video file found in torrent',
          'NO_VIDEO_FILE',
          'streaming',
          false,
          { filesCount: files.length }
        );
      }

      this.currentFile = fileSelection.selectedFile;

      // Initialize priority buffer
      this.priorityBuffer = new PriorityBuffer(
        this.currentFile.length,
        torrent.pieceLength || 16384, // Default piece length
        {
          strategy: options.bufferStrategy || 'priority',
          bufferSize: options.maxBufferSize || 30
        }
      );

      // Start HLS streaming (assuming we have an HLS endpoint)
      const hlsUrl = await this.generateHLSUrl(magnetInfo, fileSelection.index);
      await this.hlsService.initializeStream(videoElement, hlsUrl, {
        autoplay: options.autoplay,
        muted: true, // Start muted to allow autoplay
        controls: true
      });

      this.updateStatus({ state: 'buffering' });
      logStreamingEvent('Magnet streaming initialized successfully', {
        fileName: this.currentFile.name,
        fileSize: this.currentFile.length
      });

    } catch (error) {
      this.updateStatus({
        state: 'error',
        error: error instanceof Error ? error.message : 'Unknown streaming error'
      });
      this.errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Generate HLS URL (placeholder - would integrate with backend HLS conversion)
   */
  private async generateHLSUrl(magnetInfo: MagnetInfo, fileIndex: number): Promise<string> {
    // This would typically call a backend service to convert the torrent file to HLS
    // For now, return a placeholder URL
    const baseUrl = process.env.REACT_APP_HLS_BASE_URL || 'http://localhost:8888';
    return `${baseUrl}/.netlify/functions/hls?magnet=${encodeURIComponent(magnetInfo.raw)}&file=${fileIndex}`;
  }

  /**
   * Handle torrent progress updates
   */
  private handleTorrentProgress(progress: any): void {
    if (!this.priorityBuffer) return;

    const bufferHealth = this.priorityBuffer.getBufferHealth(0); // Simplified

    this.updateStatus({
      progress: progress.progress,
      downloadSpeed: progress.downloadSpeed,
      peers: progress.peers,
      bufferHealth
    });

    // Update buffer priorities (simplified - would need current playback time)
    this.priorityBuffer.updateBuffer(0, 1);

    // Trigger streaming status updates
    if (progress.progress > 0.1 && this.status.state === 'buffering') {
      this.updateStatus({ state: 'playing' });
    }
  }

  /**
   * Update streaming status
   */
  private updateStatus(updates: Partial<StreamStatus>): void {
    this.status = { ...this.status, ...updates };

    if (updates.state && updates.state !== this.status.state) {
      logStreamingEvent(`Stream state changed to ${updates.state}`);
    }

    // Notify status change callback if provided
    // This would be set during streamMagnet call
  }

  /**
   * Get current streaming status
   */
  getStatus(): StreamStatus {
    return { ...this.status };
  }

  /**
   * Pause streaming
   */
  pause(): void {
    if (this.status.state === 'playing') {
      this.updateStatus({ state: 'paused' });
      logStreamingEvent('Streaming paused');
    }
  }

  /**
   * Resume streaming
   */
  resume(): void {
    if (this.status.state === 'paused') {
      this.updateStatus({ state: 'playing' });
      logStreamingEvent('Streaming resumed');
    }
  }

  /**
   * Stop streaming and cleanup
   */
  async stop(): Promise<void> {
    try {
      if (this.currentMagnetInfo) {
        await this.webTorrentClient.removeTorrent(this.currentMagnetInfo.infoHash);
      }

      this.hlsService.cleanup();

      this.currentMagnetInfo = null;
      this.currentFile = null;
      this.priorityBuffer = null;

      this.updateStatus({
        state: 'idle',
        progress: 0,
        downloadSpeed: 0,
        peers: 0,
        bufferHealth: 0
      });

      logStreamingEvent('Streaming stopped and cleaned up');

    } catch (error) {
      logError('streaming-service', error as Error, { action: 'stop' });
    }
  }

  /**
   * Get available quality levels
   */
  getQualityLevels(): Array<{ height: number; width: number; bitrate: number; index: number }> {
    return this.hlsService.getQualityLevels();
  }

  /**
   * Set quality level
   */
  setQualityLevel(levelIndex: number): void {
    this.hlsService.setQualityLevel(levelIndex);
    const levels = this.getQualityLevels();
    const level = levels.find(l => l.index === levelIndex);

    this.updateStatus({
      currentQuality: level ? `${level.height}p` : 'auto'
    });

    logStreamingEvent('Quality level changed', { levelIndex, quality: level?.height });
  }

  /**
   * Get buffer information
   */
  getBufferInfo(): any {
    return this.hlsService.getBufferInfo();
  }

  /**
   * Cleanup all resources
   */
  async destroy(): Promise<void> {
    await this.stop();
    await this.webTorrentClient.destroy();
  }
}