import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * A6 — Sous-pages Paramètres, 100 % UI sur USER FRAIS (zéro impact baselines Aïcha) :
 *   - Catégories : créer (pastille cat-N) → éditer (maj) → supprimer une libre (disparue).
 *   - Profil : éditer le nom → le header/profil reflète le nouveau nom.
 * Un user frais n'a AUCUNE catégorie seedée → CRUD à partir de zéro, déterministe.
 */
test.use({ storageState: { cookies: [], origins: [] } })

async function freshUser(page: Page, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'set-demo-2026', name: 'Aïcha Koné' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })
}

test('Catégories : créer → éditer → supprimer (libre) — 100 % UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'setcat')
  await page.goto('/parametres/categories')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // Créer (palette étendue : 11 couleurs cat-1..11 dont les verts « revenus »).
  await page.getByRole('button', { name: /Nouvelle catégorie/ }).click()
  const create = page.getByRole('dialog')
  await expect(create).toBeVisible()
  await expect(create.getByRole('button', { name: /^Couleur cat-/ })).toHaveCount(11)
  await create.getByLabel('Nom de la catégorie').fill('Marché Cocody')
  await create.getByRole('button', { name: 'Couleur cat-9' }).click() // vert revenus étendu
  await create.getByRole('button', { name: /Créer la catégorie/ }).click()
  await expect(create).toBeHidden()
  await expect(page.getByText('Marché Cocody')).toBeVisible()

  // Éditer → maj du nom.
  await page.getByRole('button', { name: 'Modifier Marché Cocody' }).click()
  const edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await edit.getByLabel('Nom de la catégorie').fill('Marché de Cocody')
  await edit.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(edit).toBeHidden()
  await expect(page.getByText('Marché de Cocody')).toBeVisible()

  // Supprimer une catégorie LIBRE (0 opération, 0 budget) → disparue.
  await page.getByRole('button', { name: 'Modifier Marché de Cocody' }).click()
  const del = page.getByRole('dialog')
  await del.getByRole('button', { name: 'Supprimer', exact: true }).click()
  await expect(del).toBeHidden()
  await expect(page.getByText('Marché de Cocody')).toHaveCount(0)
})

test('Profil : éditer le nom → le profil reflète le nouveau nom', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'setprof')
  await page.goto('/parametres')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })

  // La sidebar (bloc bas) affiche le nom court dérivé de la session.
  await expect(page.getByText('Aïcha K.', { exact: true })).toBeVisible()

  await expect(page.getByText('Aïcha Koné').first()).toBeVisible()
  await page.getByRole('button', { name: /Modifier/ }).first().click()
  const d = page.getByRole('dialog', { name: 'Modifier le profil' })
  await expect(d).toBeVisible()
  await d.getByLabel('Nom affiché').fill('Binta Traoré')
  await d.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(d).toBeHidden()
  // Le profil ET la sidebar reflètent le nouveau nom SANS rechargement (session réactive).
  await expect(page.getByText('Binta Traoré').first()).toBeVisible()
  await expect(page.getByText('Binta T.', { exact: true })).toBeVisible()
})
