// Watchify Daemon Entrypoint
// Node.js HTTP API for torrent streaming and HLS

import express from 'express';

const app = express();
const PORT = process.env.WATCHIFY_DAEMON_PORT || 8800;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// TODO: Add /stream, /status, /cleanup endpoints

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Watchify Daemon listening on http://127.0.0.1:${PORT}`);
});
