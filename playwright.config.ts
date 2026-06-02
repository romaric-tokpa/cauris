import { defineConfig, devices } from '@playwright/test'
import {
  AUTH_FILE,
  E2E_WEB_PORT,
  E2E_WEB_ORIGIN,
  E2E_SERVER_PORT,
  E2E_SERVER_ORIGIN,
  E2E_DB_URL,
} from './e2e/constants'

/**
 * Harnais Playwright — ISOLÉ du dev (ports + DB dédiés).
 *
 * - Navigateur : Chromium uniquement.
 * - Serveurs DÉDIÉS aux tests : front Vite (5273) + backend Hono (8887), JAMAIS
 *   les ports dev (5173/8787). `reuseExistingServer: false` → Playwright lance
 *   toujours ses propres serveurs et ne réutilise JAMAIS un `npm run dev` manuel
 *   (qui pourrait servir un module périmé par HMR). `npm run e2e` est donc
 *   reproductible même si un `npm run dev` tourne en parallèle.
 * - DB JETABLE (`file:e2e-local.db`) : la commande du serveur de test
 *   `rm + db:migrate + db:seed` AVANT de booter → chaque run part d'un état
 *   propre et déterministe, sans jamais toucher la DB de dev (`local.db`).
 *   (NB : en Playwright le webServer démarre AVANT un éventuel `globalSetup` ;
 *   on séquence donc la remise à zéro DANS la commande serveur pour garantir
 *   l'ordre — la DB est fraîche quand le serveur ouvre sa connexion.)
 * - Auth : un projet `setup` crée une session (storageState) réutilisée par
 *   `smoke` et `fidelity` (sinon `/` redirige vers `/auth`).
 * - Régression visuelle : seuil SERRÉ (voir e2e/helpers/visual.ts).
 */

const BASE_URL = E2E_WEB_ORIGIN

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

  // Serveurs DÉDIÉS (Hono d'abord, puis Vite qui le proxifie) sur des ports e2e
  // disjoints du dev. `reuseExistingServer: false` → jamais de réutilisation d'un
  // dev manuel. Le backend repart d'une DB JETABLE fraîche (rm + migrate + seed)
  // à chaque run, garantissant les chiffres fixtures d'Aïcha. La DB de dev
  // (`local.db`) n'est jamais touchée (TURSO_DATABASE_URL pointe ailleurs).
  webServer: [
    {
      command:
        'rm -f e2e-local.db e2e-local.db-shm e2e-local.db-wal && npm run db:migrate && npm run db:seed && npm run dev:server',
      url: `${E2E_SERVER_ORIGIN}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        TURSO_DATABASE_URL: E2E_DB_URL,
        PORT: String(E2E_SERVER_PORT),
        BETTER_AUTH_URL: E2E_WEB_ORIGIN,
        AUTH_TRUSTED_ORIGINS: E2E_WEB_ORIGIN,
      },
    },
    {
      command: `npm run dev:web -- --port ${E2E_WEB_PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_PROXY_TARGET: E2E_SERVER_ORIGIN,
      },
    },
  ],
})
