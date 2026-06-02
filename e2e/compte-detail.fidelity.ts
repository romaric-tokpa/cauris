import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du DÉTAIL compte (Compte courant = sanity vs CompteMobDetail) :
 * hero solde, dernières opérations, « Voir toutes les opérations » → /transactions.
 * L'id est un UUID seedé → récupéré depuis la liste (1er lien « Voir les opérations »
 * = Compte courant, non bloqué), jamais codé en dur. Clair ET sombre × 390 ET 1440.
 */
test('compte detail — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await page.goto('/comptes')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  const href = await page.locator('a[href^="/comptes/"]').first().getAttribute('href')
  if (!href) throw new Error('Lien de détail compte introuvable sur /comptes')
  await expectFidelity(page, 'compte-detail', href)
})
