import { test, expect, type Page } from '@playwright/test'

/**
 * A6 — Actions Paramètres sur Aïcha (storageState par défaut), 100 % UI, SANS mutation :
 *   - nav latérale : « Catégories » mène à la sous-page (lien réel, plus .soon) ;
 *   - Import/Export : export CSV RÉEL de l'historique (événement download) ;
 *   - Centre d'aide : la recherche FILTRE réellement la FAQ.
 * Aucune écriture DB → baselines Aïcha intactes.
 */
async function bootSettings(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/parametres')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
}

test('Nav latérale : « Catégories » n’est plus morte → mène à la sous-page', async ({ page }) => {
  await bootSettings(page)
  await page.getByRole('link', { name: 'Catégories' }).click()
  await expect(page).toHaveURL(/\/parametres\/categories$/)
  await expect(page.getByRole('heading', { name: 'Catégories' })).toBeVisible()
})

test('Import/Export : export CSV réel de tout l’historique', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/parametres/import-export')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // L'import est honnêtement désactivé (pas de bouton mort).
  await expect(page.getByRole('button', { name: /Choisir un fichier/ })).toBeDisabled()

  const exportBtn = page.getByRole('button', { name: /Exporter \(\d+ opérations\)/ })
  await expect(exportBtn).toBeEnabled()
  const [download] = await Promise.all([page.waitForEvent('download'), exportBtn.click()])
  expect(download.suggestedFilename()).toBe('cauris-operations.csv')
})

test('Centre d’aide : la recherche filtre la FAQ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/parametres/aide')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // Avant filtre : plusieurs questions visibles.
  await expect(page.getByText(/créer un budget par catégorie/i)).toBeVisible()
  await expect(page.getByText(/ajouter un compte Orange Money/i)).toBeVisible()

  await page.getByLabel('Rechercher dans l’aide').fill('budget')
  await expect(page.getByText(/créer un budget par catégorie/i)).toBeVisible()
  await expect(page.getByText(/ajouter un compte Orange Money/i)).toHaveCount(0)
})
