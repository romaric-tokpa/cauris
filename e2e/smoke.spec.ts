import { test, expect } from '@playwright/test'

/**
 * Smoke test : l'application démarre et rend sans erreur fatale.
 *
 * Aucun snapshot visuel ici : l'écran courant (TokenDemo) est temporaire et sera
 * supprimé en Phase 1 — on ne crée donc aucune référence de fidélité dessus.
 * Le harnais de régression visuelle vit dans e2e/helpers/visual.ts (prêt mais non
 * encore branché sur un écran définitif).
 */
test("l'app monte et rend sans erreur de page", async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
  })

  await page.goto('/')

  // React a bien monté du contenu dans #root…
  await expect(page.locator('#root')).not.toBeEmpty()
  // …et un titre s'affiche (preuve que le composant rend).
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Aucune exception JS non capturée pendant le rendu.
  expect(pageErrors, pageErrors.join('\n')).toEqual([])
})
