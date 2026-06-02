import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de l'onglet « Prévisions » du module IA (3 soldes projetés +
 * graphe Solde projeté + table Risque de dépassement). Nourri par /api/ai/forecasts
 * (mode 'forecasts', stub déterministe → contenu reproductible). PRÉVISION §1.6 : chaque
 * estimation est encadrée (horizon + confiance + base). La donnée charge via une requête
 * dédiée → on attend `networkidle` AVANT capture. Clair ET sombre × 390 ET 1440.
 */
test('prévisions — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto('/assistant-ia/previsions')
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`previsions-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
