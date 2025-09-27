/**
 * Simplified streaming service using direct WebTorrent streaming
 */

import WebTorrent from 'webtorrent';
import { MagnetParser } from './magnetParser';
import { FileSelector } from './fileSelector';
import { logStreamingEvent, logError } from '../../utils/logger';
import { StreamingError } from '../../utils/errorHandler';

export interface StreamMagnetOptions {
  autoplay?: boolean;
  onStatusChange?: (status: StreamStatus) => void;
}

export interface StreamStatus {
  state: 'idle' | 'connecting' | 'buffering' | 'playing' | 'paused' | 'error';
  progress: number;
  downloadSpeed: number;
  peers: number;
  bufferHealth: number;
  error?: string;
}

export class SimpleStreamingService {
  private client: WebTorrent.Instance;
  private currentTorrent: WebTorrent.Torrent | null = null;
  private currentFile: WebTorrent.TorrentFile | null = null;
  private status: StreamStatus = { state: 'idle', progress: 0, downloadSpeed: 0, peers: 0, bufferHealth: 0 };

  constructor() {
    this.client = new WebTorrent({
      maxConns: 55,
      tracker: {
        announce: this.getDefaultTrackers(),
        rtcConfig: {
          iceServers: this.getIceServers()
        }
      }
    });
  }

  /**
   * Stream a magnet URI directly to video element
   */
  async streamMagnet(
    magnetUri: string,
    videoElement: HTMLVideoElement,
    options: StreamMagnetOptions = {}
  ): Promise<void> {
    try {
      this.updateStatus({ state: 'connecting' });
      logStreamingEvent('Starting direct magnet stream', { magnetUri });

      // Clean up previous torrent
      await this.destroy();

      // Parse magnet URI
      const magnetInfo = MagnetParser.parse(magnetUri);

      // Add torrent
      this.currentTorrent = await this.addTorrent(magnetInfo.raw);

      // Select best video file
      const fileSelection = FileSelector.selectBestVideoFile(
        this.currentTorrent.files.map(f => ({
          name: f.name,
          length: f.length,
          path: f.path,
          type: this.getFileType(f.name)
        }))
      );

      if (!fileSelection) {
        throw new StreamingError(
          'No suitable video file found in torrent',
          'NO_VIDEO_FILE',
          'streaming',
          false,
          { filesCount: this.currentTorrent.files.length }
        );
      }

      this.currentFile = this.currentTorrent.files[fileSelection.index];

      // Stream directly to video element
      this.currentFile.streamTo(videoElement);

      // Set up event listeners
      this.setupVideoEvents(videoElement, options);

      // Set up torrent progress tracking
      this.setupTorrentProgress();

      this.updateStatus({ state: 'buffering' });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start streaming';
      this.updateStatus({ state: 'error', error: errorMessage });
      logError('SimpleStreamingService', 'Failed to start streaming', err);
      throw err;
    }
  }

  private async addTorrent(magnetUri: string): Promise<WebTorrent.Torrent> {
    return new Promise((resolve, reject) => {
      this.client.add(magnetUri, (torrent) => {
        resolve(torrent);
      });

      // Set timeout
      setTimeout(() => {
        reject(new Error('Torrent add timeout'));
      }, 30000);
    });
  }

  private setupVideoEvents(videoElement: HTMLVideoElement, options: StreamMagnetOptions) {
    const handleCanPlay = () => {
      this.updateStatus({ state: 'playing' });
      if (options.autoplay) {
        videoElement.play().catch(console.error);
      }
    };

    const handleWaiting = () => {
      this.updateStatus({ state: 'buffering' });
    };

    const handlePlaying = () => {
      this.updateStatus({ state: 'playing' });
    };

    const handlePause = () => {
      this.updateStatus({ state: 'paused' });
    };

    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('pause', handlePause);

    // Store cleanup function
    this.videoCleanup = () => {
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('pause', handlePause);
    };
  }

  private videoCleanup?: () => void;

  private setupTorrentProgress() {
    if (!this.currentTorrent) return;

    const updateProgress = () => {
      const progress = this.currentTorrent!.progress;
      const downloadSpeed = this.currentTorrent!.downloadSpeed;
      const peers = this.currentTorrent!.numPeers;

      this.updateStatus({
        progress: progress * 100,
        downloadSpeed,
        peers,
        bufferHealth: progress * 100
      });
    };

    // Update progress every second
    this.progressInterval = setInterval(updateProgress, 1000) as unknown as number;
  }

  private progressInterval?: number;

  private updateStatus(updates: Partial<StreamStatus>) {
    this.status = { ...this.status, ...updates };
    // Status change callback would be passed through options
  }

  private getDefaultTrackers(): string[] {
    return [
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.internetwarriors.net:1337',
      'udp://tracker.leechers-paradise.org:6969',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://exodus.desync.com:6969',
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz'
    ];
  }

  private getIceServers(): RTCIceServer[] {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoTypes = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
    return videoTypes.includes(ext || '') ? 'video' : 'other';
  }

  /**
   * Get current streaming status
   */
  getStatus(): StreamStatus {
    return { ...this.status };
  }

  /**
   * Destroy the current stream
   */
  async destroy(): Promise<void> {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }

    if (this.videoCleanup) {
      this.videoCleanup();
      this.videoCleanup = undefined;
    }

    if (this.currentTorrent) {
      this.client.remove(this.currentTorrent);
      this.currentTorrent = null;
    }

    this.currentFile = null;
    this.updateStatus({ state: 'idle', progress: 0, downloadSpeed: 0, peers: 0, bufferHealth: 0 });
  }
}