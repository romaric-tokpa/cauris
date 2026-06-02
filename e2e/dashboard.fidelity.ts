import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION du Dashboard (cockpit A desktop + layout mobile), nourri
 * par /api/dashboard ET /api/ai/insights sous la session d'Aïcha. Clair ET sombre
 * × 390 ET 1440. (Projet "fidelity" → e2e/baselines/.)
 *
 * Spécifique : les insights IA chargent via une 2ᵉ requête (`['dashboard','insights']`).
 * On attend `networkidle` (toutes les requêtes résolues) AVANT la capture → contenu
 * insights DÉTERMINISTE (sinon la capture peut précéder leur arrivée). Le stub serveur
 * est déterministe, donc la baseline est stable.
 */
test('dashboard — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto('/')
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`dashboard-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
