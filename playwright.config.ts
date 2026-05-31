import { defineConfig, devices } from '@playwright/test'

/**
 * Harnais Playwright (Phase 0).
 *
 * - Navigateur : Chromium uniquement pour l'instant.
 * - Serveur : `vite dev` (port 5173). La Phase 1 pourra basculer sur `vite preview`
 *   (build de prod) pour un rendu encore plus déterministe.
 * - Régression visuelle : seuil SERRÉ documenté ci-dessous et dans
 *   `e2e/helpers/visual.ts`.
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

  // Seuil de régression visuelle GLOBAL (réutilisé par le helper de fidélité).
  //  - maxDiffPixelRatio 0.01 → au plus 1 % des pixels peuvent diverger ;
  //  - threshold 0.15 → faible tolérance colorimétrique par pixel (0 strict … 1 laxiste).
  // Serré volontairement : le gate doit rester fidèle au pixel près au wireframe.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.15,
      animations: 'disabled',
    },
  },

  projects: [
    {
      // Tests fonctionnels / smoke.
      name: 'smoke',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Gate de fidélité (Phase 1) : compare le rendu aux 8 captures du wireframe.
      // Les références vivent dans design/wireframe/screenshots/ et sont la source de
      // vérité visuelle — NE JAMAIS lancer `--update-snapshots` sur ce projet.
      name: 'fidelity',
      testMatch: /.*\.fidelity\.ts/,
      snapshotPathTemplate: '{testDir}/../design/wireframe/screenshots/{arg}{ext}',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
