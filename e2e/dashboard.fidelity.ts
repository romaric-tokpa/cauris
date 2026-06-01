import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du Dashboard (cockpit A desktop + layout mobile), nourri
 * par /api/dashboard sous la session d'Aïcha. Clair ET sombre × 390 ET 1440.
 * (Projet "fidelity" → e2e/baselines/.)
 */
test('dashboard — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'dashboard', '/')
})
