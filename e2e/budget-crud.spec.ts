import { test, expect, type Page } from '@playwright/test'

/**
 * TEST D'INTERACTION (LOT A v2 — CRUD Budgets), TOUT par l'UI (zéro appel API) :
 *   1. « Créer un budget » → drawer → création → visible dans la liste active.
 *   2. Détail → « Ajuster le plafond » → drawer → « Archiver ce budget » →
 *      disparaît de la liste active ET apparaît sous l'onglet « Archivés ».
 * Le plafond 333 000 (espace fine U+202F) sert d'empreinte unique. L'archivage UI
 * tient lieu de nettoyage → la liste active retrouve son état seedé.
 */

async function bootBudgets(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/budgets')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
}

test('Budget : créer puis archiver — entièrement par l’UI (A1)', async ({ page }) => {
  await bootBudgets(page)

  // 1. Création via le drawer.
  await page.getByRole('button', { name: /Créer un budget/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Catégorie').selectOption({ label: 'Loisirs' })
  await dialog.getByLabel('Plafond mensuel').fill('333000')
  await dialog.getByRole('button', { name: /Créer le budget/ }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText(/333\u202f000/).first()).toBeVisible()

  // 2. Détail → Ajuster → Archiver (l'action vit dans le drawer d'ajustement).
  await page.getByText(/333\u202f000/).first().click()
  await expect(page).toHaveURL(/\/budgets\/[\w-]+/)
  await page.getByRole('button', { name: /Ajuster le plafond/ }).click()
  const editDialog = page.getByRole('dialog')
  await expect(editDialog).toBeVisible()
  await editDialog.getByRole('button', { name: /Archiver ce budget/ }).click()
  await expect(editDialog).toBeHidden()

  // 3. Disparu de la liste active…
  await bootBudgets(page)
  await expect(page.getByText(/333\u202f000/)).toHaveCount(0)

  // …et présent sous l'onglet « Archivés ».
  await page.getByRole('button', { name: 'Archivés', exact: true }).click()
  await expect(page.getByText(/333\u202f000/).first()).toBeVisible()
})
