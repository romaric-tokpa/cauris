import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du shell NU (Cockpit desktop + barre basse mobile) + état
 * vide, capturé sur un module encore placeholder (`/transactions`), `/` rendant
 * désormais le Dashboard réel. Clair ET sombre × 390 ET 1440. (Projet "fidelity".)
 */
test('shell — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'shell', '/transactions')
})
