import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de l'onglet « Anomalies » du module IA (dépenses inhabituelles
 * expliquées vs habitudes par catégorie + paiements récurrents détectés). Nourri par
 * /api/ai/anomalies (mode 'anomalies', stub déterministe). §1.6 : chaque anomalie est
 * EXPLIQUÉE (jamais inventée) ; liens « Examiner » = navigation. La donnée charge via une
 * requête dédiée → on attend `networkidle` AVANT capture. Clair ET sombre × 390 ET 1440.
 */
test('anomalies — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto('/assistant-ia/anomalies')
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`anomalies-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
