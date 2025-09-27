/**
 * Unified streaming service that handles both WebTorrent and VLC fallback
 */

import { logStreamingEvent, logError } from '../../utils/logger';

export interface StreamingOptions {
  autoplay?: boolean;
  onProgress?: (progress: { downloaded: number; total: number; speed: number; peers: number }) => void;
  onStatusChange?: (status: StreamingStatus) => void;
  onError?: (error: string) => void;
}

export interface StreamingStatus {
  state: 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'error';
  method: 'webtorrent' | 'vlc' | null;
  progress: number;
  downloadSpeed: number;
  peers: number;
  bufferHealth: number;
  streamUrl?: string;
  error?: string;
}

export class UnifiedStreamingService {
  private status: StreamingStatus = {
    state: 'idle',
    method: null,
    progress: 0,
    downloadSpeed: 0,
    peers: 0,
    bufferHealth: 0
  };

  private webtorrentClient: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private webtorrentTorrent: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private webtorrentServer: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private videoElement: HTMLVideoElement | null = null;
  private options: StreamingOptions = {};

  /**
   * Stream a magnet URI with automatic fallback
   */
  async streamMagnet(
    magnetUri: string,
    videoElement: HTMLVideoElement,
    options: StreamingOptions = {}
  ): Promise<void> {
    this.videoElement = videoElement;
    this.options = options;

    this.updateStatus({ state: 'connecting' });

    try {
      // Try WebTorrent first if in Electron
      if (this.isElectronEnvironment()) {
        console.log('Attempting WebTorrent streaming...');
        await this.tryWebTorrentStreaming(magnetUri);
      } else {
        // In browser, fall back to VLC immediately
        console.log('Browser environment detected, using VLC fallback...');
        await this.fallbackToVLC(magnetUri);
      }
    } catch (error) {
      console.warn('WebTorrent failed, falling back to VLC:', error);
      await this.fallbackToVLC(magnetUri);
    }
  }

  /**
   * Check if running in Electron environment
   */
  private isElectronEnvironment(): boolean {
    return !!(window as any).electronAPI; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  /**
   * Try WebTorrent streaming
   */
  private async tryWebTorrentStreaming(magnetUri: string): Promise<void> {
    try {
      // Dynamically import WebTorrent
      const WebTorrent = await this.loadWebTorrent();

      // Create client
      this.webtorrentClient = new WebTorrent();
      console.log('WebTorrent client created');

      // Set up client error handling
      this.webtorrentClient.on('error', (err: Error) => {
        console.error('WebTorrent client error:', err);
        this.handleError('WebTorrent client error: ' + err.message);
      });

      return new Promise((resolve, reject) => {
        this.webtorrentClient.add(magnetUri, { announce: [] }, (torrent: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          console.log('Torrent added:', torrent.name);
          console.log('Torrent info hash:', torrent.infoHash);
          console.log('Files:', torrent.files.map((f: any) => ({ name: f.name, length: f.length }))); // eslint-disable-line @typescript-eslint/no-explicit-any

          this.webtorrentTorrent = torrent;

          // Find video files
          const videoFiles = torrent.files.filter((file: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
            file.name.match(/\.(mp4|mkv|avi|mov|wmv|flv|webm|m4v|3gp)$/i)
          );

          if (videoFiles.length === 0) {
            reject(new Error('No video files found in torrent'));
            return;
          }

          // Sort by size and pick largest
          videoFiles.sort((a: any, b: any) => b.length - a.length); // eslint-disable-line @typescript-eslint/no-explicit-any
          const videoFile = videoFiles[0];

          console.log('Streaming file:', videoFile.name, 'Size:', videoFile.length);

          // Create server
          this.webtorrentServer = torrent.createServer();

          // Find available port
          this.findAvailablePort(3001, 3010).then(port => {
            this.webtorrentServer.listen(port, () => {
              console.log('WebTorrent server listening on port', port);

              const fileIndex = torrent.files.indexOf(videoFile);
              const encodedFileName = encodeURIComponent(videoFile.name);
              const streamUrl = `http://localhost:${port}/${fileIndex}/${encodedFileName}`;

              console.log('Stream URL:', streamUrl);

              // Update status
              this.updateStatus({
                state: 'buffering',
                method: 'webtorrent',
                streamUrl
              });

              // Set video source
              if (this.videoElement) {
                this.videoElement.src = streamUrl;
                this.videoElement.load();
              }

              // Monitor progress
              this.monitorWebTorrentProgress();

              resolve();
            });

            this.webtorrentServer.on('error', (err: Error) => {
              console.error('Server error:', err);
              reject(err);
            });
          }).catch(reject);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          reject(new Error('WebTorrent streaming timeout'));
        }, 30000);
      });

    } catch (error) {
      console.error('Failed to load WebTorrent:', error);
      throw error;
    }
  }

  /**
   * Load WebTorrent dynamically
   */
  private async loadWebTorrent(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).electronAPI) { // eslint-disable-line @typescript-eslint/no-explicit-any
      // In Electron renderer, use require
      return new Promise((resolve, reject) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const WebTorrent = require('webtorrent');
          resolve(WebTorrent);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // In browser, WebTorrent should be available globally or via import
      if ((window as any).WebTorrent) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return (window as any).WebTorrent; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      throw new Error('WebTorrent not available in browser environment');
    }
  }

  /**
   * Fallback to VLC external playback
   */
  private async fallbackToVLC(magnetUri: string): Promise<void> {
    try {
      console.log('Opening in VLC:', magnetUri);

      if (this.isElectronEnvironment()) {
        // Use Electron IPC to open in VLC
        const result = await (window as any).electronAPI.openInVLC(magnetUri); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (result.success) {
          this.updateStatus({
            state: 'playing',
            method: 'vlc'
          });
          logStreamingEvent('VLC streaming started successfully');
        } else {
          throw new Error(result.error || 'Failed to open in VLC');
        }
      } else {
        // In browser, try to open magnet link with system default
        window.open(magnetUri, '_blank');
        this.updateStatus({
          state: 'playing',
          method: 'vlc'
        });
        logStreamingEvent('Magnet link opened in external player');
      }
    } catch (error) {
      console.error('VLC fallback failed:', error);
      this.handleError('Failed to open in external player: ' + (error as Error).message);
      throw error;
    }
  }

  /**
   * Find an available port
   */
  private async findAvailablePort(startPort: number, maxPort: number): Promise<number> {
    for (let port = startPort; port <= maxPort; port++) {
      try {
        await fetch(`http://localhost:${port}`, { method: 'HEAD', mode: 'no-cors' });
        // If we get here, port might be in use, try next
      } catch {
        // Port is likely available
        return port;
      }
    }
    throw new Error('No available ports found');
  }

  /**
   * Monitor WebTorrent progress
   */
  private monitorWebTorrentProgress(): void {
    if (!this.webtorrentTorrent) return;

    const updateProgress = () => {
      if (!this.webtorrentTorrent) return;

      const progress = this.webtorrentTorrent.progress || 0;
      const downloadSpeed = this.webtorrentTorrent.downloadSpeed || 0;
      const peers = this.webtorrentTorrent.numPeers || 0;

      console.log(`WebTorrent Progress: ${(progress * 100).toFixed(1)}%, Speed: ${this.formatBytes(downloadSpeed)}/s, Peers: ${peers}`);

      this.updateStatus({
        progress,
        downloadSpeed,
        peers,
        bufferHealth: progress
      });

      // Call progress callback
      if (this.options.onProgress) {
        this.options.onProgress({
          downloaded: progress * (this.webtorrentTorrent.length || 0),
          total: this.webtorrentTorrent.length || 0,
          speed: downloadSpeed,
          peers
        });
      }

      // Update playing state when sufficiently buffered
      if (progress > 0.1 && this.status.state === 'buffering') {
        this.updateStatus({ state: 'playing' });
      }
    };

    // Update immediately and then periodically
    updateProgress();
    const progressInterval = setInterval(updateProgress, 1000);

    // Clear interval when torrent is done or destroyed
    this.webtorrentTorrent.on('done', () => {
      clearInterval(progressInterval);
      this.updateStatus({ state: 'playing', progress: 1 });
    });
  }

  /**
   * Update streaming status
   */
  private updateStatus(updates: Partial<StreamingStatus>): void {
    this.status = { ...this.status, ...updates };

    if (updates.state && updates.state !== this.status.state) {
      logStreamingEvent(`Stream state changed to ${updates.state} (${this.status.method || 'unknown'})`);
    }

    if (this.options.onStatusChange) {
      this.options.onStatusChange(this.status);
    }
  }

  /**
   * Handle streaming errors
   */
  private handleError(error: string): void {
    console.error('Streaming error:', error);
    this.updateStatus({
      state: 'error',
      error
    });

    if (this.options.onError) {
      this.options.onError(error);
    }

    logError('unified-streaming', error);
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * Get current status
   */
  getStatus(): StreamingStatus {
    return { ...this.status };
  }

  /**
   * Stop streaming and cleanup
   */
  async stop(): Promise<void> {
    try {
      // Clean up WebTorrent resources
      if (this.webtorrentServer) {
        this.webtorrentServer.close();
        this.webtorrentServer = null;
      }

      if (this.webtorrentTorrent) {
        this.webtorrentTorrent.destroy();
        this.webtorrentTorrent = null;
      }

      if (this.webtorrentClient) {
        this.webtorrentClient.destroy();
        this.webtorrentClient = null;
      }

      // Clear video source
      if (this.videoElement) {
        this.videoElement.src = '';
        this.videoElement.load();
      }

      this.updateStatus({
        state: 'idle',
        method: null,
        progress: 0,
        downloadSpeed: 0,
        peers: 0,
        bufferHealth: 0,
        streamUrl: undefined,
        error: undefined
      });

      logStreamingEvent('Unified streaming stopped and cleaned up');

    } catch (error) {
      logError('unified-streaming', error as Error, { action: 'stop' });
    }
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
}