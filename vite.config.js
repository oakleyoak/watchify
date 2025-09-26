import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills({
    globals: {
      Buffer: true,
      global: true,
      process: true,
    },
    protocolImports: true,
  })],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Provide browser-compatible fallbacks for Node.js modules
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util',
      'events': 'events',
      'buffer': 'buffer',
      'path': 'path-browserify',
      'url': 'url',
      'querystring': 'querystring-es3'
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js specific modules that WebTorrent uses
        // These will be handled by WebTorrent's browser-compatible fallbacks
        return id.includes('bittorrent-dht') ||
               id.includes('torrent-discovery') ||
               id.includes('utp-native') ||
               id.includes('dgram') ||
               id.includes('net') ||
               id.includes('fs');
      }
    }
  },
  optimizeDeps: {
    include: ['webtorrent'],
    exclude: ['bittorrent-dht', 'torrent-discovery']
  }
})