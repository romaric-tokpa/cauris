import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du shell NU (Cockpit desktop + barre basse mobile) + état
 * vide, capturé sur un module encore placeholder. Cible `/parametres` (implémenté
 * en dernier → reste placeholder le plus longtemps). Clair ET sombre × 390 ET 1440.
 */
test('shell — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'shell', '/parametres')
})
