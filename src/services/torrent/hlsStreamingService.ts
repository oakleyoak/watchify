/**
 * HLS streaming service for adaptive bitrate streaming
 */

import Hls from 'hls.js';
import { logger, logStreamingEvent, logError } from '../../utils/logger';
import { HLSStreamingError, retryWithBackoff } from '../../utils/errorHandler';

export interface HLSConfig {
  enableWorker: boolean;
  maxBufferLength: number;
  maxMaxBufferLength: number;
  levelLoadingMaxRetry: number;
  levelLoadingMaxRetryTimeout: number;
  manifestLoadingMaxRetry: number;
  manifestLoadingMaxRetryTimeout: number;
}

export interface HLSStreamOptions {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  config?: Partial<HLSConfig>;
}

export class HLSStreamingService {
  private hlsInstance: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentSrc: string | null = null;
  private isDestroyed = false;

  private defaultConfig: HLSConfig = {
    enableWorker: true,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    levelLoadingMaxRetry: 4,
    levelLoadingMaxRetryTimeout: 4000,
    manifestLoadingMaxRetry: 4,
    manifestLoadingMaxRetryTimeout: 4000
  };

  /**
   * Initialize HLS streaming for a video element
   */
  async initializeStream(
    videoElement: HTMLVideoElement,
    hlsUrl: string,
    options: HLSStreamOptions = {}
  ): Promise<void> {
    try {
      this.cleanup();

      this.videoElement = videoElement;
      this.currentSrc = hlsUrl;

      // Check if HLS is supported
      if (!this.isHLSSupported()) {
        throw new HLSStreamingError(
          'HLS is not supported in this browser',
          'HLS_NOT_SUPPORTED',
          false
        );
      }

      // Create HLS instance
      this.hlsInstance = new Hls({
        ...this.defaultConfig,
        ...options.config
      });

      this.setupHLSEventHandlers();
      this.attachHLSToVideo(hlsUrl);

      // Set video element properties
      if (options.muted !== undefined) {
        videoElement.muted = options.muted;
      }
      if (options.controls !== undefined) {
        videoElement.controls = options.controls;
      }

      logStreamingEvent('HLS stream initialized', { hlsUrl });

    } catch (error) {
      logError('hls-streaming', error as Error, { hlsUrl });
      throw error instanceof HLSStreamingError ? error : new HLSStreamingError(
        `Failed to initialize HLS stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INIT_FAILED',
        true,
        { hlsUrl, originalError: error }
      );
    }
  }

  /**
   * Load HLS manifest with retry logic
   */
  private async loadManifestWithRetry(hlsUrl: string): Promise<void> {
    if (!this.hlsInstance) {
      throw new HLSStreamingError('HLS instance not initialized', 'NOT_INITIALIZED', false);
    }

    await retryWithBackoff(
      () => new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Manifest loading timeout'));
        }, 10000);

        const onManifestParsed = () => {
          clearTimeout(timeout);
          this.hlsInstance!.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          this.hlsInstance!.off(Hls.Events.ERROR, onError);
          resolve();
        };

        const onError = (event: any, data: any) => {
          if (data.fatal) {
            clearTimeout(timeout);
            this.hlsInstance!.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
            this.hlsInstance!.off(Hls.Events.ERROR, onError);
            reject(new Error(`Manifest loading failed: ${data.details}`));
          }
        };

        this.hlsInstance!.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
        this.hlsInstance!.on(Hls.Events.ERROR, onError);
        this.hlsInstance!.loadSource(hlsUrl);
      }),
      { maxAttempts: 3, delayMs: 1000 },
      'hls-manifest-load'
    );
  }

  /**
   * Attach HLS to video element
   */
  private attachHLSToVideo(hlsUrl: string): void {
    if (!this.hlsInstance || !this.videoElement) return;

    this.hlsInstance.attachMedia(this.videoElement);
    this.loadManifestWithRetry(hlsUrl);
  }

  /**
   * Setup HLS event handlers
   */
  private setupHLSEventHandlers(): void {
    if (!this.hlsInstance) return;

    this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      logger.info('hls-streaming', 'Manifest parsed', {
        levels: data.levels.length,
        audioTracks: data.audioTracks?.length || 0
      });
    });

    this.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      logger.debug('hls-streaming', 'Quality level switched', {
        level: data.level,
        bitrate: this.hlsInstance?.levels[data.level]?.bitrate
      });
    });

    this.hlsInstance.on(Hls.Events.FRAG_LOADED, (event, data) => {
      logger.debug('hls-streaming', 'Fragment loaded', {
        level: data.frag.level,
        sn: data.frag.sn
      });
    });

    this.hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      this.handleHLSError(data);
    });

    this.hlsInstance.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
      logger.debug('hls-streaming', 'Buffer appended', {
        timeRanges: data.timeRanges.video?.length || 0
      });
    });
  }

  /**
   * Handle HLS errors
   */
  private handleHLSError(data: any): void {
    const { type, details, fatal } = data;

    logger.warn('hls-streaming', 'HLS error occurred', {
      type,
      details,
      fatal,
      url: this.currentSrc
    });

    if (fatal) {
      switch (type) {
        case 'networkError':
          // Try to recover network error
          logger.info('hls-streaming', 'Attempting to recover from network error');
          this.hlsInstance?.startLoad();
          break;

        case 'mediaError':
          // Try to recover media error
          logger.info('hls-streaming', 'Attempting to recover from media error');
          this.hlsInstance?.recoverMediaError();
          break;

        default:
          // Fatal error, destroy and re-initialize
          logger.error('hls-streaming', 'Fatal HLS error, reinitializing', { type, details });
          this.reinitializeStream();
          break;
      }
    }
  }

  /**
   * Reinitialize stream after fatal error
   */
  private async reinitializeStream(): Promise<void> {
    if (!this.currentSrc || !this.videoElement) return;

    try {
      logger.info('hls-streaming', 'Reinitializing HLS stream');
      await this.initializeStream(this.videoElement, this.currentSrc);
    } catch (error) {
      logError('hls-streaming', error as Error, { reinitialize: true });
    }
  }

  /**
   * Get available quality levels
   */
  getQualityLevels(): Array<{ height: number; width: number; bitrate: number; index: number }> {
    if (!this.hlsInstance) return [];

    return this.hlsInstance.levels.map((level, index) => ({
      height: level.height,
      width: level.width,
      bitrate: level.bitrate,
      index
    }));
  }

  /**
   * Set quality level
   */
  setQualityLevel(levelIndex: number): void {
    if (!this.hlsInstance) return;

    if (levelIndex >= 0 && levelIndex < this.hlsInstance.levels.length) {
      this.hlsInstance.currentLevel = levelIndex;
      logger.info('hls-streaming', 'Quality level set', { levelIndex });
    }
  }

  /**
   * Get current quality level
   */
  getCurrentQualityLevel(): number {
    return this.hlsInstance?.currentLevel ?? -1;
  }

  /**
   * Get buffer info
   */
  getBufferInfo(): { buffered: TimeRanges; currentTime: number; duration: number } | null {
    if (!this.videoElement) return null;

    return {
      buffered: this.videoElement.buffered,
      currentTime: this.videoElement.currentTime,
      duration: this.videoElement.duration || 0
    };
  }

  /**
   * Check if HLS is supported
   */
  isHLSSupported(): boolean {
    return Hls.isSupported();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }

    if (this.videoElement) {
      this.videoElement.src = '';
      this.videoElement.load();
    }

    this.currentSrc = null;
    this.isDestroyed = true;

    logStreamingEvent('HLS stream cleaned up');
  }

  /**
   * Check if service is destroyed
   */
  isServiceDestroyed(): boolean {
    return this.isDestroyed;
  }
}