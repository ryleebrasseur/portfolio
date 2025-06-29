import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ryleebrasseur/story-scroller': path.resolve(__dirname, '../../packages/story-scroller/src'),
    },
  },
  server: {
    port: 5174,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['tests/**/*.spec.{js,jsx,ts,tsx}', '**/node_modules/**', '**/dist/**'],
  },
})