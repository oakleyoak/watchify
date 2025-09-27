# Watchify Daemon-HLS Rewrite: Architecture Research

## OSS Patterns and Precedents

### 1. **webtorrent-desktop**
- **Pattern:** Electron shell + Node.js (webtorrent-hybrid) in main process, all torrent logic in Node, UI talks to Node via IPC.
- **Pros:** Proven, cross-platform, robust. Handles all torrent logic outside the renderer. Uses WebTorrent for streaming.
- **Cons:** No HLS output, heavy UI, not minimal.

### 2. **peerflix/peerflix-server**
- **Pattern:** Node.js CLI/daemon exposes HTTP API, streams via HTTP, can be used as a backend for any UI. Uses webtorrent or torrent-stream.
- **Pros:** Simple, daemonized, easy to wrap with Electron or any frontend. Peerflix-server exposes a REST API.
- **Cons:** No HLS, just HTTP progressive streaming.

### 3. **Jackett**
- **Pattern:** Background .NET daemon for torrent index/search, exposes HTTP API, used by Stremio/Sonarr/Radarr.
- **Pros:** Proven daemon pattern, robust, self-hostable.
- **Cons:** Not a streaming engine, just search.

### 4. **Stremio**
- **Pattern:** Electron shell, all heavy logic in Node.js, UI is minimal, add-ons provide streaming via HTTP.
- **Pros:** Modular, robust, but more complex.

### 5. **torrent-stream**
- **Pattern:** Node.js library for torrent streaming, used in peerflix and other daemons.
- **Pros:** Stable, Node-native, but less active than webtorrent-hybrid.

### 6. **HLS via ffmpeg**
- **Pattern:** Use fluent-ffmpeg to transcode/segment video on-the-fly, serve via HTTP endpoints.
- **Pros:** Standard for adaptive streaming, works with all players.

## Chosen Architecture
- **Daemonized Node.js service** (Express or Fastify) running on localhost, handling all torrent logic and HLS segmenting.
- **webtorrent-hybrid** for torrent engine (TCP + WebRTC support, Node-native, proven in peerflix/webtorrent-desktop).
- **fluent-ffmpeg** for HLS segmenting, with per-stream temp directories and cleanup.
- **Electron shell** as a minimal UI, communicates with daemon via HTTP only.
- **No React/Vite/SPA:** UI is a thin controller, not a web app.

## Key Libraries
- `webtorrent-hybrid` (or fallback to `torrent-stream` if needed)
- `fluent-ffmpeg` (for HLS)
- `express` (or `fastify`)
- `electron`
- `hls.js` (frontend, only if needed)
- `jest` (unit tests)
- `playwright` or `node-fetch` (integration/E2E tests)

## Justification
- This pattern is proven in OSS (peerflix-server, webtorrent-desktop, Stremio add-ons).
- Keeps all heavy logic out of the UI, making the app robust and easy to maintain.
- HLS output ensures compatibility with all players and enables adaptive streaming.
- All components are free, OSS, and cross-platform.

## Next Steps
- Repo cleanup, dependency pruning, and daemon skeleton implementation.
- Commit each phase as a separate commit on feature/daemon-hls-rewrite branch.
