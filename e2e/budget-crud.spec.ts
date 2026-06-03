import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * TEST D'INTERACTION (LOT A v2 — CRUD Budgets) :
 *   « Nouveau budget » → drawer → création → budget visible dans la liste.
 * Le plafond 333 000 sert d'empreinte unique pour l'assertion ET le nettoyage
 * (pas de DELETE budget → on ARCHIVE le budget créé pour restaurer la liste seedée).
 */

interface BudgetRow {
  id: string
  cap: number
}

async function archiveByCap(request: APIRequestContext, cap: number) {
  const { budgets } = (await (await request.get('/api/budgets')).json()) as { budgets: BudgetRow[] }
  for (const b of budgets.filter((x) => x.cap === cap)) {
    await request.post(`/api/budgets/${b.id}/archive`)
  }
}

test('Nouveau budget : drawer -> creation -> visible dans la liste (A1)', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/budgets')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  await page.getByRole('button', { name: /Créer un budget/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Categorie de depense + plafond empreinte (333 000) -> creation.
  await dialog.getByLabel('Catégorie').selectOption({ label: 'Loisirs' })
  await dialog.getByLabel('Plafond mensuel').fill('333000')
  await dialog.getByRole('button', { name: /Créer le budget/ }).click()

  // Drawer ferme + le budget apparait dans la liste (empreinte 333, groupe milliers U+202F).
  await expect(dialog).toBeHidden()
  await expect(page.getByText(/333\u202f000/).first()).toBeVisible()

  // Nettoyage : archiver le budget cree (la liste active retrouve son etat seede).
  await archiveByCap(request, 333000)
})
