/**
 * Intelligent file selection service for torrent streaming
 */

import { logger } from '../../utils/logger';
import { TorrentFile } from './webTorrentClient';

export interface FileSelectionCriteria {
  preferredTypes?: string[];
  preferredExtensions?: string[];
  minSize?: number;
  maxSize?: number;
  excludePatterns?: RegExp[];
  prioritizeBySize?: boolean;
  prioritizeByName?: boolean;
}

export interface FileSelectionResult {
  selectedFile: TorrentFile;
  index: number;
  score: number;
  reason: string;
}

export class FileSelector {
  private static readonly VIDEO_EXTENSIONS = [
    'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ogv'
  ];

  private static readonly AUDIO_EXTENSIONS = [
    'mp3', 'aac', 'ogg', 'wav', 'flac', 'm4a', 'wma', 'opus'
  ];

  private static readonly SUBTITLE_EXTENSIONS = [
    'srt', 'vtt', 'ass', 'ssa', 'sub', 'idx'
  ];

  /**
   * Select the best video file from torrent files
   */
  static selectBestVideoFile(files: TorrentFile[], criteria: FileSelectionCriteria = {}): FileSelectionResult | null {
    const videoFiles = this.filterVideoFiles(files, criteria);

    if (videoFiles.length === 0) {
      logger.warn('file-selector', 'No video files found in torrent');
      return null;
    }

    if (videoFiles.length === 1) {
      return {
        selectedFile: videoFiles[0].file,
        index: videoFiles[0].index,
        score: 100,
        reason: 'Only video file available'
      };
    }

    // Score and rank files
    const scoredFiles = videoFiles.map(({ file, index }) => ({
      selectedFile: file,
      index,
      score: this.scoreVideoFile(file, criteria),
      reason: this.getScoringReason(file, criteria)
    }));

    // Sort by score (descending)
    scoredFiles.sort((a, b) => b.score - a.score);

    const best = scoredFiles[0];

    logger.info('file-selector', 'Selected best video file', {
      fileName: best.selectedFile.name,
      score: best.score,
      reason: best.reason,
      totalCandidates: videoFiles.length
    });

    return best;
  }

  /**
   * Filter files to get only video files
   */
  private static filterVideoFiles(files: TorrentFile[], criteria: FileSelectionCriteria): Array<{ file: TorrentFile; index: number }> {
    return files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => {
        // Check if it's a video file
        if (file.type !== 'video' && !this.isVideoExtension(file.name)) {
          return false;
        }

        // Apply size filters
        if (criteria.minSize && file.length < criteria.minSize) {
          return false;
        }
        if (criteria.maxSize && file.length > criteria.maxSize) {
          return false;
        }

        // Apply exclusion patterns
        if (criteria.excludePatterns) {
          const matchesExclusion = criteria.excludePatterns.some(pattern =>
            pattern.test(file.name) || pattern.test(file.path)
          );
          if (matchesExclusion) {
            return false;
          }
        }

        return true;
      });
  }

  /**
   * Check if file has video extension
   */
  private static isVideoExtension(filename: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return this.VIDEO_EXTENSIONS.includes(ext);
  }

  /**
   * Score a video file based on various criteria
   */
  private static scoreVideoFile(file: TorrentFile, criteria: FileSelectionCriteria): number {
    let score = 50; // Base score

    const filename = file.name.toLowerCase();
    const ext = this.getFileExtension(filename);

    // Preferred extensions get bonus
    if (criteria.preferredExtensions?.includes(ext)) {
      score += 30;
    }

    // MP4 and WebM are widely supported
    if (['mp4', 'webm'].includes(ext)) {
      score += 20;
    }

    // MKV is good but may need conversion
    if (ext === 'mkv') {
      score += 15;
    }

    // Size preferences
    if (criteria.prioritizeBySize) {
      // Prefer files between 100MB and 4GB (reasonable video sizes)
      const sizeGB = file.length / (1024 * 1024 * 1024);
      if (sizeGB >= 0.1 && sizeGB <= 4) {
        score += 15;
      } else if (sizeGB > 4) {
        score -= 10; // Penalize very large files
      }
    }

    // Name-based prioritization
    if (criteria.prioritizeByName) {
      // Prefer files with common video naming patterns
      if (this.hasGoodVideoName(filename)) {
        score += 10;
      }

      // Avoid sample files
      if (this.isSampleFile(filename)) {
        score -= 50;
      }

      // Avoid trailer files
      if (this.isTrailerFile(filename)) {
        score -= 30;
      }
    }

    // Clamp score between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get reason for scoring
   */
  private static getScoringReason(file: TorrentFile, criteria: FileSelectionCriteria): string {
    const ext = this.getFileExtension(file.name);
    const reasons: string[] = [];

    if (criteria.preferredExtensions?.includes(ext)) {
      reasons.push('preferred extension');
    }

    if (['mp4', 'webm'].includes(ext)) {
      reasons.push('widely supported format');
    }

    if (criteria.prioritizeBySize) {
      const sizeGB = file.length / (1024 * 1024 * 1024);
      if (sizeGB >= 0.1 && sizeGB <= 4) {
        reasons.push('optimal size');
      }
    }

    if (criteria.prioritizeByName && this.hasGoodVideoName(file.name.toLowerCase())) {
      reasons.push('good naming pattern');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'default selection';
  }

  /**
   * Check if filename indicates a good video file
   */
  private static hasGoodVideoName(filename: string): boolean {
    // Look for common video file naming patterns
    const goodPatterns = [
      /\b\d{4}\b/, // Year
      /\b1080p?\b/i,
      /\b720p?\b/i,
      /\b4k\b/i,
      /\bbluray\b/i,
      /\bweb-dl\b/i,
      /\bhdtv\b/i
    ];

    return goodPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Check if file is a sample
   */
  private static isSampleFile(filename: string): boolean {
    const samplePatterns = [
      /\bsample\b/i,
      /\bdemo\b/i,
      /\btrailer\b/i,
      /sample\./i,
      /\bpreview\b/i
    ];

    return samplePatterns.some(pattern => pattern.test(filename));
  }

  /**
   * Check if file is a trailer
   */
  private static isTrailerFile(filename: string): boolean {
    return /\btrailer\b/i.test(filename);
  }

  /**
   * Get file extension
   */
  private static getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
  }

  /**
   * Get all video files with their indices
   */
  static getVideoFiles(files: TorrentFile[]): Array<{ file: TorrentFile; index: number }> {
    return files
      .map((file, index) => ({ file, index }))
      .filter(({ file }) => file.type === 'video' || this.isVideoExtension(file.name));
  }

  /**
   * Get file type from extension
   */
  static getFileType(filename: string): string {
    const ext = this.getFileExtension(filename).toLowerCase();

    if (this.VIDEO_EXTENSIONS.includes(ext)) return 'video';
    if (this.AUDIO_EXTENSIONS.includes(ext)) return 'audio';
    if (this.SUBTITLE_EXTENSIONS.includes(ext)) return 'subtitle';

    return 'other';
  }
}