import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import vue from '@vitejs/plugin-vue'
import { babel } from '@rollup/plugin-babel'

export default defineConfig(({ mode }) => {
  const isTest = mode === 'test'

  const plugins: any[] = isTest ? [vue()] : [uni()]

  if (!isTest) {
    plugins.push(
      babel({
        babelHelpers: 'bundled',
        presets: [
          ['@babel/preset-env', { targets: { ie: '11' } }]
        ],
        include: [/\.(?:js|ts)$/],
        exclude: [],
        extensions: ['.js', '.ts']
      })
    )
  }

  return {
    plugins,
    build: isTest ? {} : {
      minify: 'terser',
      terserOptions: {
        ecma: 5
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts']
    }
  }
})
