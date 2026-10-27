import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Local evidence must never reload an open editor while tests write traces.
      ignored: ['**/models/local/**', '**/test-results/**', '**/playwright-report/**'],
    },
  },
})
