import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baselines de RÉGRESSION de l'écran Notifications, nourri par /api/notifications sous
 * la session d'Aïcha (7 notifs, 3 non lues, deep-links résolus serveur). Un filtre =
 * une URL (?tab=), persistés. Desktop : 4 filtres (Toutes/Non lues/Alertes/Rappels) ;
 * mobile : 3 chips (Rappels retombe sur Toutes). Groupes Non lues / Plus tôt.
 * Clair+sombre × 390+1440.
 */
test('notifications — toutes (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'notifications-toutes', '/notifications')
})

test('notifications — non lues (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'notifications-non-lues', '/notifications?tab=Non%20lues')
})

test('notifications — alertes (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'notifications-alertes', '/notifications?tab=Alertes')
})

test('notifications — rappels (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'notifications-rappels', '/notifications?tab=Rappels')
})
