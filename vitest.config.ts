import { defineConfig } from 'vitest/config'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    exclude: ['tests/browser/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
}))
