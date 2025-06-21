import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Use environment variable for base path to support both GitHub Pages subdirectory and custom domain
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
