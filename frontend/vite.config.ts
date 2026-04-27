import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  return {
    plugins: isTest ? [vue()] : [uni()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts']
    }
  }
})
