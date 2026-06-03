import { test, expect, type Page } from '@playwright/test'

/**
 * GARDE D'INTERACTION — LOT A v2 / A1 (transferts + récurrences).
 * Au-delà du rendu : on déclenche les nouveaux formulaires et on vérifie l'EFFET
 * (création visible), puis on NETTOIE (suppression) pour ne pas polluer la DB de
 * test partagée. Le transfert est daté HORS période démo (juin) → aucun impact sur
 * les baselines de fidélité (scopées Mai 2026), même si le nettoyage échouait.
 */

async function bootDesktop(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/transactions')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
}

test('Transfert : Ajouter → Type Transfert → Depuis/Vers → Transférer → créé puis supprimé', async ({
  page,
}) => {
  await bootDesktop(page)

  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByRole('button', { name: 'Transfert', exact: true }).click()
  await dialog.locator('.inp.big input').fill('50000')
  await dialog.getByLabel('Depuis').selectOption({ index: 1 })
  await dialog.getByLabel('Vers').selectOption({ index: 2 })
  // Hors période démo → n'altère pas les baselines Mai 2026.
  await dialog.locator('input[type="date"]').fill('2026-06-20')
  await dialog.getByRole('button', { name: 'Transférer' }).click()

  // Effet : le drawer se ferme (soumission réussie, pas d'échec silencieux).
  await expect(dialog).toBeHidden()

  // Le transfert apparaît dans le périmètre de juin.
  await page.goto('/transactions?type=Transfert&from=2026-06-01&to=2026-06-30')
  const created = page.getByText(/Transfert vers/).first()
  await expect(created).toBeVisible()

  // Nettoyage : ouvrir → Supprimer.
  await created.click()
  const edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await edit.getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByText(/Transfert vers/)).toHaveCount(0)
})

test('Récurrence : onglet Récurrentes → Nouvelle récurrence → visible dans la table → supprimée', async ({
  page,
}) => {
  await bootDesktop(page)

  await page.getByRole('button', { name: 'Récurrentes' }).click()
  await page.getByRole('button', { name: 'Nouvelle récurrence' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await dialog.getByRole('textbox', { name: 'Libellé' }).fill('Test Disney+')
  await dialog.locator('.inp.big input').fill('3000')
  await dialog.getByRole('button', { name: 'Créer', exact: false }).click()

  // Effet : la ligne apparaît dans la table des récurrences (cellule = desktop).
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('cell', { name: 'Test Disney+', exact: true })).toBeVisible()

  // Nettoyage : édition → Supprimer.
  await page.getByRole('button', { name: 'Modifier Test Disney+' }).click()
  const edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await edit.getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByText('Test Disney+')).toHaveCount(0)
})
