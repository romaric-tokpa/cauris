import { test, expect } from '@playwright/test'

/**
 * TEST DE GARDE — comble l'angle mort qui a laissé passer la régression « clic perdu ».
 *
 * Régression (sous-bloc B) : `React.lazy` + `<Suspense>` autour de l'`Outlet` du data-router
 * créait une fenêtre où l'écran était interactif mais la transition de navigation pas encore
 * stabilisée → un `setState` local (clic) était rattaché à un rendu concurrent JETÉ, et
 * l'overlay ne s'ouvrait JAMAIS. Corrigé via le `lazy` NATIF de react-router (chunk chargé
 * PENDANT la navigation, avant montage de l'écran).
 *
 * Ce test reproduit EXACTEMENT le déclencheur : navigation CLIENT-SIDE (clic sidebar, pas
 * `goto`) puis clic IMMÉDIAT (dès que le bouton est actionnable, sans attendre `networkidle`)
 * sur un bouton d'action qui ouvre un overlay piloté par un `useState` LOCAL. Il ÉCHOUAIT avec
 * `React.lazy` et DOIT passer avec le `lazy` natif. Deux écrans couverts.
 */

test('Transactions : nav client-side → clic immédiat « Ajouter » ouvre le drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // Navigation CLIENT-SIDE (pas de goto) puis clic le plus tôt possible.
  await page.getByRole('link', { name: 'Transactions' }).click()
  await page.getByRole('button', { name: /Ajouter une transaction/i }).first().click()

  // L'overlay (state local `formOpen`) DOIT s'afficher — pas de clic perdu.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
})

test('Dashboard : clic « Ajouter une transaction » → /transactions, drawer ouvert', async ({ page }) => {
  // Le bouton du dashboard n'avait aucun onClick (mort). Il navigue désormais vers
  // `/transactions?new=1` → l'écran Transactions ouvre le drawer depuis l'URL.
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()

  await expect(page).toHaveURL(/\/transactions/)
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
})

test('Mobile : le FAB « + » ouvre le drawer d’ajout de transaction', async ({ page }) => {
  // Angle mort historique : le FAB de la barre basse mobile n'avait AUCUN onClick
  // (bouton mort). Il navigue désormais vers `/transactions?new=1` → drawer d'ajout.
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'Ajouter une transaction' }).click()

  await expect(page).toHaveURL(/\/transactions/)
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
})

test('Paramètres : nav client-side → clic immédiat « Modifier » ouvre le drawer mot de passe', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  await page.getByRole('link', { name: 'Paramètres' }).click()
  // Bouton « Modifier » de la ligne Mot de passe (state local `pwdOpen`).
  const pwdRow = page.locator('.set-row', { hasText: 'Mot de passe' })
  await pwdRow.getByRole('button', { name: 'Modifier' }).click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
})
