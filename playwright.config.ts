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
      // Gate de RÉGRESSION visuelle (Phase 1+) : baselines AUTO-GÉNÉRÉES, stockées
      // dans e2e/baselines/, pour clair+sombre × 390+1440. Elles détectent les
      // dérives futures du rendu (≠ fidélité au wireframe, qui se fait par revue
      // humaine du rendu vs composant source .jsx — voir /revue-fidelite).
      //
      // Les PNG de design/wireframe/screenshots/ NE sont PLUS des baselines :
      // captures canvas desktop (chrome/scroll/overlays, pas de mobile), inutilisables
      // au pixel. Aucun couplage automatique vers ce dossier ici.
      //
      // Le suffixe {platform} évite les faux positifs entre macOS (dev) et Linux (CI).
      name: 'fidelity',
      testMatch: /.*\.fidelity\.ts/,
      snapshotPathTemplate: '{testDir}/baselines/{arg}-{platform}{ext}',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Le smoke test n'a besoin que du front (pas du backend Hono).
    command: 'npm run dev:web -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
