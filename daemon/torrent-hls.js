// Daemon: torrent and HLS pipeline logic
// This module will be imported by index.mjs

import WebTorrent from 'webtorrent';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const client = new WebTorrent();

/**
 * Add a torrent and return the file to stream (largest video file by default)
 * @param {string} magnetURI
 * @returns {Promise<{torrent: any, file: any}>}
 */
export async function addTorrent(magnetURI) {
  return new Promise((resolve, reject) => {
    client.add(magnetURI, torrent => {
      // Pick largest video file
      const file = torrent.files
        .filter(f => f.name.match(/\.(mp4|mkv|webm|avi)$/i))
        .sort((a, b) => b.length - a.length)[0];
      if (!file) return reject(new Error('No video file found in torrent'));
      resolve({ torrent, file });
    });
  });
}

/**
 * Start ffmpeg HLS pipeline for a file
 * @param {any} file - WebTorrent file
 * @param {string} outDir - Output directory for HLS segments
 * @returns {ChildProcess}
 */
export function startHlsPipeline(file, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // ffmpeg command for HLS
  const ffmpegArgs = [
    '-i', 'pipe:0',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '0',
    '-hls_segment_filename', path.join(outDir, 'segment_%03d.ts'),
    path.join(outDir, 'index.m3u8')
  ];
  const ffmpeg = spawn('ffmpeg', ffmpegArgs);
  // Pipe torrent file to ffmpeg
  file.createReadStream().pipe(ffmpeg.stdin);
  return ffmpeg;
}
