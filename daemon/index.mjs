// Watchify Daemon Entrypoint
// Node.js HTTP API for torrent streaming and HLS


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { addTorrent, startHlsPipeline } from './torrent-hls.js';
import fs from 'fs';
import logger from './logger.js';
import cors from 'cors';

const app = express();
const PORT = process.env.WATCHIFY_DAEMON_PORT || 8800;

app.use(cors()); // Allow CORS for Electron UI
app.use(express.json());

// Track active streams
const activeStreams = new Map();

// Health check
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ status: 'ok', version: '0.1.0' });
});


// POST /stream { magnet: string }
app.post('/stream', async (req, res) => {
  const { magnet } = req.body;
  if (!magnet) {
    logger.warn('Stream request missing magnet');
    return res.status(400).json({ error: 'Missing magnet' });
  }
  logger.info('Starting stream for magnet', { magnet: magnet.substring(0, 50) + '...' });
  try {
    const { torrent, file } = await addTorrent(magnet);
    const outDir = path.join(__dirname, 'hls', Date.now().toString());
    const ffmpeg = startHlsPipeline(file, outDir);
    // Wait for index.m3u8 to appear (basic readiness)
    const m3u8Path = path.join(outDir, 'index.m3u8');
    let waited = 0;
    while (!fs.existsSync(m3u8Path) && waited < 10000) {
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }
    if (!fs.existsSync(m3u8Path)) {
      logger.error('HLS playlist not ready', { magnet });
      throw new Error('HLS playlist not ready');
    }
    const streamId = path.basename(outDir);
    activeStreams.set(streamId, { torrent, ffmpeg, outDir });
    logger.info('Stream started', { streamId, magnet });
    // Return HLS playlist URL
    res.json({ playlist: `/hls/${streamId}/index.m3u8`, streamId });
  } catch (e) {
    logger.error('Failed to start stream', { error: e.message, magnet });
    res.status(500).json({ error: e.message });
  }
});

// GET /status - list active streams
app.get('/status', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([id, data]) => ({
    id,
    infoHash: data.torrent.infoHash,
    progress: data.torrent.progress,
    peers: data.torrent.numPeers
  }));
  logger.info('Status requested', { activeStreams: streams.length });
  res.json({ streams });
});

// POST /cleanup { streamId: string }
app.post('/cleanup', (req, res) => {
  const { streamId } = req.body;
  if (!streamId || !activeStreams.has(streamId)) {
    logger.warn('Cleanup requested for invalid streamId', { streamId });
    return res.status(400).json({ error: 'Invalid streamId' });
  }
  const { torrent, ffmpeg, outDir } = activeStreams.get(streamId);
  torrent.destroy();
  ffmpeg.kill();
  fs.rmSync(outDir, { recursive: true, force: true });
  activeStreams.delete(streamId);
  logger.info('Stream cleaned up', { streamId });
  res.json({ success: true });
});

// Serve HLS static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/hls', express.static(path.join(__dirname, 'hls')));

app.listen(PORT, '127.0.0.1', () => {
  logger.info(`Watchify Daemon listening on http://127.0.0.1:${PORT}`);
});
