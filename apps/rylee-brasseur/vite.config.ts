import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Use environment variable for base path, default to root
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  define: {
    // Define process.env for browser compatibility
    'process.env': process.env,
  },
  resolve: {
    alias: {
      '@ryleebrasseur/motion-system': path.resolve(
        __dirname,
        '../../packages/motion-system/src'
      ),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 10000,
    },
    hmr: {
      overlay: true,
    },
  },
})
