import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baselines de RÉGRESSION de l'écran Analytics, nourri par /api/analytics sous la
 * session d'Aïcha (dérivé de la même façade que le dashboard/budgets). Un onglet =
 * une URL (?tab=), onglets persistés. Desktop : 4 onglets ; mobile : 3 chips
 * (Overview/Catégories/Tendances — pas « Budget vs réel », qui retombe sur Overview).
 * Clair+sombre × 390+1440.
 */
test('analytics — overview (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'analytics-overview', '/analytics')
})

test('analytics — catégories (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'analytics-categories', '/analytics?tab=Catégories')
})

test('analytics — tendances (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'analytics-tendances', '/analytics?tab=Tendances')
})

test('analytics — budget vs réel (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'analytics-budget', '/analytics?tab=Budget%20vs%20r%C3%A9el')
})
