import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de l'écran Transactions (table+filtres desktop · liste
 * groupée mobile), nourri par /api/transactions sous la session d'Aïcha (drawer
 * fermé). Clair ET sombre × 390 ET 1440. (Projet "fidelity" → e2e/baselines/.)
 */
test('transactions — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'transactions', '/transactions')
})
