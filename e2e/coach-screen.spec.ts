import { test, expect } from '@playwright/test'

/**
 * ÉCRAN COACH (Lot C4) — réponse « 4 couches » branchée aux vraies données (Aïcha) :
 *  (a) chargement → question par défaut (survive) → 4 couches + étiquette d'honnêteté ;
 *  (b) « Puis-je dépenser [montant] ? » → recalcul (la couche analyse cite l'achat) ;
 *  (c) dégradé (Aïcha : cash ~12 j → confiance non-haute) → « je ne peux pas conclure
 *      solidement » + action « Réconcilier le cash » CLIQUABLE → navigation réelle.
 * Session Aïcha (storageState par défaut).
 */

test('Coach : 4 couches + étiquette déterministe + recalcul afford', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/assistant-ia')

  // Les 4 couches sont rendues + l'étiquette d'honnêteté du wireframe est VISIBLE.
  await expect(page.getByText('Réponse en 4 couches')).toBeVisible()
  await expect(page.getByText('Calcul déterministe · reformulé en langage clair')).toBeVisible()
  // .first() : « Recommandation » est aussi un niveau d'intervention (rail) — on vise la couche.
  for (const t of ['Données observées', 'Analyse calculée', 'Niveau de confiance', 'Recommandation']) {
    await expect(page.getByText(t, { exact: true }).first()).toBeVisible()
  }

  // Bascule sur « Puis-je dépenser un montant ? » → la couche analyse cite l'achat.
  await page.getByRole('button', { name: /Puis-je dépenser un montant/ }).click()
  await page.locator('.inp.big input').fill('250000')
  await expect(page.getByText(/Cet achat la ramènerait à/)).toBeVisible()
})

test('Coach : dégradé Aïcha → « pas conclure solidement » + action « Réconcilier le cash » navigue', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/assistant-ia')

  // Confiance non-haute (cash non réconcilié) → dégradation explicite.
  await expect(page.getByText(/je ne peux pas conclure solidement/i)).toBeVisible()

  // Action de fiabilisation cliquable → navigation RÉELLE vers l'enveloppe (B4).
  const reconcile = page.getByRole('link', { name: /Réconcilier le cash/ })
  await expect(reconcile).toBeVisible()
  await reconcile.click()
  await expect(page).toHaveURL(/\/comptes\/[^/]+\/enveloppe$/)
  await expect(page.getByText(/restants/)).toBeVisible()
})
