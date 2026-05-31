import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du shell (Cockpit desktop + barre basse mobile), pour
 * thème clair ET sombre × largeurs 390 ET 1440. Détecte les dérives futures.
 * (Projet "fidelity" → e2e/baselines/.)
 */
test('shell — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'shell', '/')
})
