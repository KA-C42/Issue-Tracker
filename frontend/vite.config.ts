import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // dev only: access backend paths via /api/backend-path instead of full url
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    exclude: ['**/e2e/**', '**/node_modules/**'],
    setupFiles: ['./tests/vitest.setup.ts'],
    environment: 'jsdom',
    clearMocks: true,
    mockReset: true,
    unstubGlobals: true,
  },
  optimizeDeps: {
    include: ['@issue-tracker/shared'],
  },
})
