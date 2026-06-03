import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * CYCLE DE VIE OBJECTIF (LOT A v2), 100 % UI sur USER FRAIS (zéro baseline Aïcha) :
 *   A. objectif SANS contribution → « Supprimer » offert → disparu.
 *   B. objectif AVEC contribution → « Supprimer » ABSENT (refus serveur 409) →
 *      « Archiver cet objectif » → disparu de la liste.
 */
test.use({ storageState: { cookies: [], origins: [] } })

async function createGoal(page: Page, name: string, cap: string) {
  await page.goto('/objectifs')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Créer un objectif/ }).click()
  const d = page.getByRole('dialog')
  await expect(d).toBeVisible()
  await d.getByLabel(/Nom de l/).fill(name)
  await d.getByLabel(/Montant cible/).fill(cap)
  await d.getByRole('button', { name: /Créer l/ }).click()
  await expect(d).toBeHidden()
  await expect(page.getByText(name).first()).toBeVisible()
}

test('Objectif : supprimer (vide) vs archiver (contribué) — 100 % UI (A1)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const origin = E2E_WEB_ORIGIN
  const email = `goallife-${Date.now()}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'goal-demo-2026', name: 'Lifer' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })

  // ── A. Objectif vide → Supprimer.
  await createGoal(page, 'À supprimer', '100000')
  await page.getByText('À supprimer').first().click()
  await expect(page).toHaveURL(/\/objectifs\/[\w-]+/)
  await page.getByRole('button', { name: /Modifier/ }).click()
  let edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await edit.getByRole('button', { name: 'Supprimer', exact: true }).click()
  await expect(page).toHaveURL(/\/objectifs$/)
  await expect(page.getByText('À supprimer')).toHaveCount(0)

  // ── B. Objectif contribué → Supprimer absent → Archiver.
  await createGoal(page, 'À archiver', '200000')
  await page.getByText('À archiver').first().click()
  await expect(page).toHaveURL(/\/objectifs\/[\w-]+/)

  // Contribuer (compte « Aucun » accepté).
  await page.getByRole('button', { name: /Ajouter une contribution/ }).click()
  const contrib = page.getByRole('dialog')
  await expect(contrib).toBeVisible()
  await contrib.locator('.inp.big input').fill('50000')
  await contrib.getByRole('button', { name: /Contribuer/ }).click()
  await expect(contrib).toBeHidden()

  // Modifier : Supprimer ABSENT (contribution présente), Archiver offert.
  await page.getByRole('button', { name: /Modifier/ }).click()
  edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await expect(edit.getByRole('button', { name: 'Supprimer', exact: true })).toHaveCount(0)
  await edit.getByRole('button', { name: /Archiver cet objectif/ }).click()
  await expect(page).toHaveURL(/\/objectifs$/)
  await expect(page.getByText('À archiver')).toHaveCount(0)
})
