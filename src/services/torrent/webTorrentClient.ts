/**
 * WebTorrent client service for P2P torrent streaming
 */

import WebTorrent from 'webtorrent';
import { logger, logTorrentProgress, logError } from '../../utils/logger';
import { TorrentError, retryWithBackoff } from '../../utils/errorHandler';
import { MagnetInfo } from './magnetParser';

export interface TorrentFile {
  name: string;
  length: number;
  path: string;
  type?: string;
}

export interface TorrentProgress {
  downloaded: number;
  total: number;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  ratio: number;
}

export interface WebTorrentClientOptions {
  maxPeers?: number;
  downloadLimit?: number;
  uploadLimit?: number;
  trackerTimeout?: number;
}

export class WebTorrentClient {
  private client: WebTorrent.Instance;
  private activeTorrents: Map<string, WebTorrent.Torrent> = new Map();
  private progressCallbacks: Map<string, (progress: TorrentProgress) => void> = new Map();

  constructor(options: WebTorrentClientOptions = {}) {
    this.client = new WebTorrent({
      maxConns: options.maxPeers || 55,
      downloadLimit: options.downloadLimit || -1,
      uploadLimit: options.uploadLimit || -1,
      tracker: {
        announce: this.getDefaultTrackers(),
        rtcConfig: {
          iceServers: this.getIceServers()
        }
      }
    });

    this.setupClientEventHandlers();
    logger.info('webtorrent-client', 'WebTorrent client initialized', options);
  }

  /**
   * Add a torrent by magnet URI
   */
  async addTorrent(magnetInfo: MagnetInfo, options: {
    path?: string;
    onProgress?: (progress: TorrentProgress) => void;
  } = {}): Promise<WebTorrent.Torrent> {
    const { infoHash } = magnetInfo;

    if (this.activeTorrents.has(infoHash)) {
      logger.warn('webtorrent-client', 'Torrent already active', { infoHash });
      return this.activeTorrents.get(infoHash)!;
    }

    try {
      const torrent = await this.addTorrentWithRetry(magnetInfo.raw, options.path);

      this.activeTorrents.set(infoHash, torrent);
      if (options.onProgress) {
        this.progressCallbacks.set(infoHash, options.onProgress);
        this.setupTorrentProgressTracking(torrent);
      }

      logger.info('webtorrent-client', 'Torrent added successfully', {
        infoHash,
        name: torrent.name,
        files: torrent.files.length
      });

      return torrent;

    } catch (error) {
      logError('webtorrent-client', error as Error, { infoHash, magnetUri: magnetInfo.raw });
      throw new TorrentError(
        `Failed to add torrent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ADD_TORRENT_FAILED',
        true,
        { infoHash, magnetUri: magnetInfo.raw }
      );
    }
  }

  /**
   * Add torrent with retry logic
   */
  private async addTorrentWithRetry(magnetUri: string, path?: string): Promise<WebTorrent.Torrent> {
    return retryWithBackoff(
      () => new Promise<WebTorrent.Torrent>((resolve, reject) => {
        const opts: WebTorrent.TorrentOptions = {};
        if (path) opts.path = path;

        this.client.add(magnetUri, opts, (torrent) => {
          resolve(torrent);
        });

        // Set timeout for torrent addition
        setTimeout(() => {
          reject(new Error('Torrent addition timeout'));
        }, 30000); // 30 second timeout
      }),
      { maxAttempts: 3, delayMs: 2000 },
      'torrent-add'
    );
  }

  /**
   * Get torrent files
   */
  getTorrentFiles(infoHash: string): TorrentFile[] {
    const torrent = this.activeTorrents.get(infoHash);
    if (!torrent) {
      throw new TorrentError('Torrent not found', 'TORRENT_NOT_FOUND', false, { infoHash });
    }

    return torrent.files.map(file => ({
      name: file.name,
      length: file.length,
      path: file.path,
      type: this.getFileType(file.name)
    }));
  }

  /**
   * Select and stream a specific file
   */
  createFileStream(infoHash: string, fileIndex: number, options: {
    start?: number;
    end?: number;
  } = {}): ReadableStream<Uint8Array> {
    const torrent = this.activeTorrents.get(infoHash);
    if (!torrent) {
      throw new TorrentError('Torrent not found', 'TORRENT_NOT_FOUND', false, { infoHash });
    }

    if (fileIndex < 0 || fileIndex >= torrent.files.length) {
      throw new TorrentError('Invalid file index', 'INVALID_FILE_INDEX', false, {
        infoHash,
        fileIndex,
        totalFiles: torrent.files.length
      });
    }

    const file = torrent.files[fileIndex];
    const stream = file.createReadStream(options);

    logger.info('webtorrent-client', 'File stream created', {
      infoHash,
      fileName: file.name,
      fileIndex,
      start: options.start,
      end: options.end
    });

    return stream;
  }

  /**
   * Get torrent progress
   */
  getTorrentProgress(infoHash: string): TorrentProgress | null {
    const torrent = this.activeTorrents.get(infoHash);
    if (!torrent) return null;

    return {
      downloaded: torrent.downloaded,
      total: torrent.length,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      peers: torrent.numPeers,
      ratio: torrent.ratio
    };
  }

  /**
   * Remove torrent
   */
  removeTorrent(infoHash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const torrent = this.activeTorrents.get(infoHash);
      if (!torrent) {
        resolve();
        return;
      }

      torrent.destroy((error) => {
        if (error) {
          logger.error('webtorrent-client', 'Failed to remove torrent', { infoHash, error });
          reject(new TorrentError('Failed to remove torrent', 'REMOVE_FAILED', false, { infoHash }));
        } else {
          this.activeTorrents.delete(infoHash);
          this.progressCallbacks.delete(infoHash);
          logger.info('webtorrent-client', 'Torrent removed', { infoHash });
          resolve();
        }
      });
    });
  }

  /**
   * Destroy client and clean up all torrents
   */
  async destroy(): Promise<void> {
    const destroyPromises = Array.from(this.activeTorrents.keys()).map(infoHash =>
      this.removeTorrent(infoHash).catch(error =>
        logger.warn('webtorrent-client', 'Error removing torrent during destroy', { infoHash, error })
      )
    );

    await Promise.all(destroyPromises);
    this.client.destroy();
    logger.info('webtorrent-client', 'WebTorrent client destroyed');
  }

  /**
   * Setup client event handlers
   */
  private setupClientEventHandlers(): void {
    this.client.on('error', (error) => {
      logger.error('webtorrent-client', 'WebTorrent client error', error);
    });

    this.client.on('torrent', (torrent) => {
      logger.info('webtorrent-client', 'New torrent added to client', {
        infoHash: torrent.infoHash,
        name: torrent.name
      });
    });
  }

  /**
   * Setup progress tracking for a torrent
   */
  private setupTorrentProgressTracking(torrent: WebTorrent.Torrent): void {
    const progressCallback = this.progressCallbacks.get(torrent.infoHash);
    if (!progressCallback) return;

    const updateProgress = () => {
      const progress = this.getTorrentProgress(torrent.infoHash);
      if (progress) {
        progressCallback(progress);
        logTorrentProgress(torrent.infoHash, progress.progress, progress.downloadSpeed, progress.peers);
      }
    };

    torrent.on('download', updateProgress);
    torrent.on('upload', updateProgress);
    torrent.on('done', () => {
      logger.info('webtorrent-client', 'Torrent download completed', { infoHash: torrent.infoHash });
      updateProgress();
    });
  }

  /**
   * Get default trackers
   */
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

  /**
   * Get ICE servers for WebRTC
   */
  private getIceServers(): RTCIceServer[] {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }

  /**
   * Determine file type from filename
   */
  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoTypes = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
    const audioTypes = ['mp3', 'aac', 'ogg', 'wav', 'flac', 'm4a'];

    if (videoTypes.includes(ext || '')) return 'video';
    if (audioTypes.includes(ext || '')) return 'audio';
    return 'other';
  }
}