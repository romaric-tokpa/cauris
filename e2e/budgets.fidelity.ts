import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de la liste Budgets (cartes Gauge desktop · cartes
 * Progress mobile), nourrie par /api/budgets sous la session d'Aïcha. Onglet
 * « Actifs » par défaut. Clair ET sombre × 390 ET 1440. (Projet "fidelity".)
 */
test('budgets — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'budgets', '/budgets')
})
