import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Node.js modules that WebTorrent needs
      include: ['buffer', 'process', 'events', 'stream', 'util', 'path', 'crypto'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  base: './', // Important for Electron to load assets correctly
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Allow connections from Electron
    cors: true,
    hmr: {
      port: 5173,
    },
    // Additional headers for WebTorrent
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: ['electron', 'webtorrent'], // Don't bundle electron or webtorrent in production
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['webtorrent', 'torrent-search-api'],
    exclude: ['electron'], // Don't optimize electron
  },
})