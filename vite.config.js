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
      'querystring': 'querystring-es3',
      // Fix WebTorrent module resolution
      'webtorrent': 'webtorrent/dist/webtorrent.min.js'
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js specific modules
        return id.includes('utp-native') ||
               id.includes('dgram') ||
               id.includes('net') ||
               id.includes('fs');
      },
      output: {
        // Ensure .mjs files are handled correctly
        format: 'es'
      }
    }
  },
  optimizeDeps: {
    include: ['webtorrent', 'framer-motion', 'motion-dom'],
    esbuildOptions: {
      loader: {
        '.mjs': 'js'
      }
    }
  },
  // Add server config to handle .mjs files
  server: {
    fs: {
      // Allow serving files from node_modules for .mjs files
      allow: ['.']
    }
  }
})