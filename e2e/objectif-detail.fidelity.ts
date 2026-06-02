import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du DÉTAIL objectif (cas « Fonds d'urgence » = sanity vs
 * obj-desk.png) : hero Donut + stats, conseil IA RÉEL, historique des contributions,
 * carte Projection (moyenne réelle + projection §1.6 encadrée). La projection charge
 * via une 2ᵉ requête (`['goals',id,'projection']`) → on attend `networkidle` AVANT
 * capture pour un contenu DÉTERMINISTE (stub déterministe). Id seedé récupéré depuis
 * la liste (jamais codé en dur). Clair ET sombre × 390 ET 1440.
 */
test('objectif detail — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  await page.goto('/objectifs')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  const link = page.locator('a[href^="/objectifs/"]', { hasText: 'Fonds' }).first()
  const href = await link.getAttribute('href')
  if (!href) throw new Error('Lien du détail « Fonds d’urgence » introuvable sur /objectifs')

  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto(href)
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`objectif-detail-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
