import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baselines de RÉGRESSION de l'écran Prêt / Dette, nourri par /api/loans + /api/loans/:id
 * sous la session d'Aïcha (prêt « Prêt auto » cohérent). Un onglet = une URL (?tab=),
 * onglets persistés. Mobile : seules « Vue générale » (défaut) et « Simulation » existent ;
 * pour les onglets desktop-only, le mobile retombe sur la vue condensée. Clair+sombre × 390+1440.
 */
test('pret — vue générale (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'pret-overview', '/pret')
})

test('pret — amortissement (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'pret-amortissement', '/pret?tab=Amortissement')
})

test('pret — paiements (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'pret-paiements', '/pret?tab=Paiements')
})

test('pret — simulation (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'pret-simulation', '/pret?tab=Simulation')
})
