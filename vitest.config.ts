import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['frontend/**', 'node_modules/**'],
    setupFiles: ['./tests/setup.ts']
  }
})
