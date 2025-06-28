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
      '@ryleebrasseur/shared-types': path.resolve(
        __dirname,
        '../../packages/shared-types'
      ),
      '@ryleebrasseur/shared-utils': path.resolve(
        __dirname,
        '../../packages/shared-utils/src'
      ),
      '@ryleebrasseur/dev-tools': path.resolve(
        __dirname,
        '../../packages/dev-tools/src'
      ),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000, // Reduced from 10000ms for better HMR performance
    },
    hmr: {
      overlay: true,
      port: 5173,
      protocol: 'ws',
      host: 'localhost',
    },
  },
  build: {
    // Build optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // TODO: Consider enabling for production builds
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'animation-vendor': ['gsap', 'framer-motion', 'lenis'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'framer-motion',
      'lenis',
    ],
    exclude: [
      '@ryleebrasseur/motion-system',
      '@ryleebrasseur/shared-types',
      '@ryleebrasseur/shared-utils',
      '@ryleebrasseur/dev-tools',
    ],
  },
})
