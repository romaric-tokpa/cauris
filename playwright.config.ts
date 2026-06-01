import { defineConfig, devices } from '@playwright/test'
import { AUTH_FILE } from './e2e/constants'

/**
 * Harnais Playwright.
 *
 * - Navigateur : Chromium uniquement.
 * - Serveurs : front Vite (5173, proxy /api) + backend Hono (8787) — les gardes de
 *   route exigent une session, donc les deux tournent.
 * - Auth : un projet `setup` crée une session (storageState) réutilisée par `smoke`
 *   et `fidelity` (sinon `/` redirige vers `/auth`).
 * - Régression visuelle : seuil SERRÉ (voir e2e/helpers/visual.ts).
 */

const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.15,
      animations: 'disabled',
    },
  },

  projects: [
    // Crée la session de test (cookies → storageState).
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Smoke : app authentifiée monte sans erreur.
    {
      name: 'smoke',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },

    // Gate de RÉGRESSION visuelle : baselines AUTO-GÉNÉRÉES dans e2e/baselines/
    // (clair+sombre × 390+1440). Suffixe {platform} pour éviter les faux positifs
    // macOS (dev) ↔ Linux (CI). Les PNG de design/wireframe/screenshots/ NE sont
    // PAS des baselines (captures canvas desktop, pas de mobile).
    {
      name: 'fidelity',
      testMatch: /.*\.fidelity\.ts/,
      snapshotPathTemplate: '{testDir}/baselines/{arg}-{platform}{ext}',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],

  // Les deux serveurs (Hono d'abord, puis Vite qui le proxifie). Le backend seede
  // d'abord les données démo d'Aïcha (idempotent) → le dashboard rend les chiffres
  // fixtures sous la session e2e d'Aïcha.
  webServer: [
    {
      command: 'npm run db:seed && npm run dev:server',
      url: 'http://localhost:8787/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev:web -- --port 5173 --strictPort',
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
