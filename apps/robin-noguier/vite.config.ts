import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Use environment variable to determine base path
  // For custom domain: set VITE_BASE_PATH='/' or leave empty
  // For GitHub Pages repository: set VITE_BASE_PATH='/portfolio/'
  base: process.env.VITE_BASE_PATH || '/portfolio/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,
      interval: 10000,
    },
    hmr: {
      overlay: true,
    },
  },
})
