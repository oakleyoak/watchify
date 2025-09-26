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
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize Node.js specific modules that cause issues in browser builds
        return id.includes('bittorrent-dht') ||
               (id.includes('torrent-discovery') && !id.includes('browser'));
      }
    }
  }
})