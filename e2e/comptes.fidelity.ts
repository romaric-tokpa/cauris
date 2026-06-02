import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de la liste Comptes (grille desktop 1:1 ComptesDesk · liste
 * mobile extrapolée), nourrie par /api/accounts sous la session d'Aïcha. Onglet
 * « Tous » par défaut ; Wave bloqué → solde « ••• ••• ». Clair ET sombre × 390 ET 1440.
 */
test('comptes — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'comptes', '/comptes')
})
