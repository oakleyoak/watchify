/**
 * Magnet URI parsing and validation service
 */

import { logger } from '../../utils/logger';
import { TorrentError } from '../../utils/errorHandler';

export interface MagnetInfo {
  infoHash: string;
  name?: string;
  trackers: string[];
  peers?: string[];
  raw: string;
}

export class MagnetParser {
  private static readonly MAGNET_PREFIX = 'magnet:?';

  /**
   * Parse a magnet URI and extract torrent information
   */
  static parse(magnetUri: string): MagnetInfo {
    try {
      if (!magnetUri.startsWith(this.MAGNET_PREFIX)) {
        throw new TorrentError(
          'Invalid magnet URI format',
          'INVALID_MAGNET_FORMAT',
          false,
          { magnetUri }
        );
      }

      const uri = magnetUri.slice(this.MAGNET_PREFIX.length);
      const params = new URLSearchParams(uri);

      // Extract info hash (required)
      const xt = params.get('xt');
      if (!xt || !xt.startsWith('urn:btih:')) {
        throw new TorrentError(
          'Missing or invalid info hash in magnet URI',
          'MISSING_INFO_HASH',
          false,
          { magnetUri, xt }
        );
      }

      const infoHash = xt.slice('urn:btih:'.length).toLowerCase();

      // Validate info hash format (40 hex chars or 32 base32 chars)
      if (!this.isValidInfoHash(infoHash)) {
        throw new TorrentError(
          'Invalid info hash format',
          'INVALID_INFO_HASH',
          false,
          { infoHash }
        );
      }

      // Extract display name
      const name = params.get('dn') || undefined;

      // Extract trackers
      const trackers = params.getAll('tr');

      // Extract peer addresses (optional)
      const peers = params.getAll('x.pe');

      const magnetInfo: MagnetInfo = {
        infoHash,
        name,
        trackers,
        peers: peers.length > 0 ? peers : undefined,
        raw: magnetUri
      };

      logger.debug('magnet-parser', 'Successfully parsed magnet URI', {
        infoHash: magnetInfo.infoHash,
        name: magnetInfo.name,
        trackerCount: trackers.length,
        peerCount: peers.length
      });

      return magnetInfo;

    } catch (error) {
      if (error instanceof TorrentError) {
        throw error;
      }

      logger.error('magnet-parser', 'Failed to parse magnet URI', { magnetUri, error });
      throw new TorrentError(
        'Failed to parse magnet URI',
        'PARSE_ERROR',
        false,
        { magnetUri, originalError: error }
      );
    }
  }

  /**
   * Validate info hash format
   */
  private static isValidInfoHash(hash: string): boolean {
    // 40 hex characters (SHA-1)
    if (hash.length === 40 && /^[a-f0-9]{40}$/i.test(hash)) {
      return true;
    }

    // 32 base32 characters (common in magnet links)
    if (hash.length === 32 && /^[a-z2-7]{32}$/i.test(hash)) {
      return true;
    }

    return false;
  }

  /**
   * Extract info hash from magnet URI (convenience method)
   */
  static extractInfoHash(magnetUri: string): string {
    const info = this.parse(magnetUri);
    return info.infoHash;
  }

  /**
   * Create a magnet URI from components
   */
  static createMagnetUri(info: {
    infoHash: string;
    name?: string;
    trackers?: string[];
  }): string {
    let magnet = `${this.MAGNET_PREFIX}xt=urn:btih:${info.infoHash}`;

    if (info.name) {
      magnet += `&dn=${encodeURIComponent(info.name)}`;
    }

    if (info.trackers && info.trackers.length > 0) {
      info.trackers.forEach(tracker => {
        magnet += `&tr=${encodeURIComponent(tracker)}`;
      });
    }

    return magnet;
  }

  /**
   * Validate magnet URI format without full parsing
   */
  static isValidMagnetUri(magnetUri: string): boolean {
    try {
      this.parse(magnetUri);
      return true;
    } catch {
      return false;
    }
  }
}