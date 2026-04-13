import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup-env.ts', './tests/setup-db.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    fileParallelism: false,
    silent: 'passed-only',
  },
})
