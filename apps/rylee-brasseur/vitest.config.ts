import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})