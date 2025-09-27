// Watchify Daemon Entrypoint
// Node.js HTTP API for torrent streaming and HLS


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { addTorrent, startHlsPipeline } from './torrent-hls.js';
import fs from 'fs';

const app = express();
const PORT = process.env.WATCHIFY_DAEMON_PORT || 8800;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});


// POST /stream { magnet: string }
app.post('/stream', async (req, res) => {
  const { magnet } = req.body;
  if (!magnet) return res.status(400).json({ error: 'Missing magnet' });
  try {
    // Use __dirname in ESM
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const outDir = path.join(__dirname, 'hls', Date.now().toString());
    const { file } = await addTorrent(magnet);
    startHlsPipeline(file, outDir);
    // Wait for index.m3u8 to appear (basic readiness)
    const m3u8Path = path.join(outDir, 'index.m3u8');
    let waited = 0;
    while (!fs.existsSync(m3u8Path) && waited < 10000) {
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }
    if (!fs.existsSync(m3u8Path)) throw new Error('HLS playlist not ready');
    // Return HLS playlist URL
    res.json({ playlist: `/hls/${path.basename(outDir)}/index.m3u8` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve HLS static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/hls', express.static(path.join(__dirname, 'hls')));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Watchify Daemon listening on http://127.0.0.1:${PORT}`);
});
