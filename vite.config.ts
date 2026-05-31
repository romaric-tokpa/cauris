import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En dev, le front appelle /api/* qui est proxifié vers le backend Hono.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Vitest = tests unitaires sous src/ uniquement.
    // Les tests e2e (e2e/**) sont gérés par Playwright, pas par Vitest.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
