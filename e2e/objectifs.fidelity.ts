import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de la liste Objectifs (grille desktop EXTRAPOLÉE · liste
 * mobile ObjMob 1:1), nourrie par /api/goals sous la session d'Aïcha. Onglet
 * « En cours » par défaut. Clair ET sombre × 390 ET 1440. (Projet "fidelity".)
 */
test('objectifs — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'objectifs', '/objectifs')
})
