import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du DÉTAIL budget (cas dépassement Transport = sanity vs
 * budget-detail.png) : bandeau d'alerte, conseil IA placeholder, carte stats
 * enveloppe, section transactions liées (distinction enveloppe ≠ catégorie).
 *
 * L'id budget est un UUID seedé → on le récupère depuis la liste (lien de la
 * carte Transport), jamais codé en dur. Clair ET sombre × 390 ET 1440.
 */
test('budget detail — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await page.goto('/budgets')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  const link = page.locator('a[href^="/budgets/"]', { hasText: 'Transport' }).first()
  const href = await link.getAttribute('href')
  if (!href) throw new Error('Lien du budget Transport introuvable sur /budgets')
  await expectFidelity(page, 'budget-detail', href)
})
