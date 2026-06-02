import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du DÉTAIL budget (cas dépassement Transport = sanity vs
 * budget-detail.png) : bandeau d'alerte, conseil IA RÉEL (askClaude budget-advice),
 * carte stats enveloppe, transactions liées (distinction enveloppe ≠ catégorie).
 *
 * L'id budget est un UUID seedé → récupéré depuis la liste (lien carte Transport),
 * jamais codé en dur. Le conseil charge via une 2ᵉ requête (`['budgets',id,'advice']`)
 * → on attend `networkidle` AVANT capture pour un contenu DÉTERMINISTE (stub déterministe).
 * Clair ET sombre × 390 ET 1440.
 */
test('budget detail — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await page.goto('/budgets')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  const link = page.locator('a[href^="/budgets/"]', { hasText: 'Transport' }).first()
  const href = await link.getAttribute('href')
  if (!href) throw new Error('Lien du budget Transport introuvable sur /budgets')

  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto(href)
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`budget-detail-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
