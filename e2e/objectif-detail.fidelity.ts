import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du DÉTAIL objectif (cas « Fonds d'urgence » = sanity vs
 * obj-desk.png) : hero Donut + stats, conseil IA placeholder, historique des
 * contributions (échantillon récent), carte Projection (moyenne réelle + prévision
 * en placeholder). L'id est un UUID seedé → récupéré depuis la liste (lien de la
 * carte « Fonds… »), jamais codé en dur. Clair ET sombre × 390 ET 1440.
 */
test('objectif detail — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await page.goto('/objectifs')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  const link = page.locator('a[href^="/objectifs/"]', { hasText: 'Fonds' }).first()
  const href = await link.getAttribute('href')
  if (!href) throw new Error('Lien du détail « Fonds d’urgence » introuvable sur /objectifs')
  await expectFidelity(page, 'objectif-detail', href)
})
