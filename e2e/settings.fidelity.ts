import { test, expect } from '@playwright/test'
import { applyTheme, setWidth, THEMES, WIDTHS, VISUAL_THRESHOLD } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de l'écran Paramètres (Profil + Préférences + Sécurité ;
 * desktop = nav latérale + 3 sections, mobile = profil + groupes + déconnexion).
 * Nom/email réels (session Aïcha), Mode sombre réel, « Comptes bloqués » dérivé de
 * /api/accounts (Wave bloqué). On attend `networkidle` AVANT capture (le libellé des
 * comptes bloqués charge via une requête). Clair ET sombre × 390 ET 1440.
 */
test('paramètres — régression visuelle (clair/sombre × 390/1440)', async ({ page }) => {
  for (const theme of THEMES) {
    for (const width of [WIDTHS.mobile, WIDTHS.desktop]) {
      await setWidth(page, width)
      await page.goto('/parametres')
      await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
      await page.waitForLoadState('networkidle')
      await applyTheme(page, theme)
      await expect(page).toHaveScreenshot(`settings-${theme}-${width}.png`, VISUAL_THRESHOLD)
    }
  }
})
