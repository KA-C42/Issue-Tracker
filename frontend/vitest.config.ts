import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['**/e2e/**', '**/node_modules/**'],
    setupFiles: ['./tests/vitest.setup.ts'],
    environment: 'jsdom',
    clearMocks: true,
  },
})
