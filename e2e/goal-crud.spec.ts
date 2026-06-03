import { test, expect } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * TEST D'INTERACTION (LOT A v2 — CRUD Objectifs), 100 % UI sur un USER FRAIS
 * (zéro impact sur les baselines d'Aïcha — pas de DELETE objectif).
 *   « Créer un objectif » → drawer → création → visible dans la liste →
 *   détail → PROJECTION §1.6 calculée sur la VRAIE date cible (rythme suggéré).
 *
 * Cible 800 000, déjà 50 000 → reste 750 000 ; date cible déc. 2026 (6 mois depuis
 * juin 2026) → rythme suggéré déterministe = ceil(750 000 / 6) = 125\u202f000 / mois.
 */
test.use({ storageState: { cookies: [], origins: [] } })

test('Nouvel objectif : drawer → création → visible + projection calculée (A1)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const origin = E2E_WEB_ORIGIN
  const email = `goal-${Date.now()}@cauris.demo`
  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { email, password: 'goal-demo-2026', name: 'Goalie' },
    headers: { origin },
  })
  expect(signup.ok()).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })

  // Création via le drawer.
  await page.goto('/objectifs')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Créer un objectif/ }).click()
  const d = page.getByRole('dialog')
  await expect(d).toBeVisible()
  await d.getByLabel(/Nom de l/).fill('Voyage à Dakar')
  await d.getByLabel(/Montant cible/).fill('800000')
  await d.getByLabel(/Déjà épargné/).fill('50000')
  await d.getByLabel('Date cible').fill('2026-12-31')
  await d.getByRole('button', { name: /Créer l/ }).click()
  await expect(d).toBeHidden()

  // Visible dans la liste.
  await expect(page.getByText('Voyage à Dakar').first()).toBeVisible()

  // Détail → projection calculée sur la vraie date cible.
  await page.getByText('Voyage à Dakar').first().click()
  await expect(page).toHaveURL(/\/objectifs\/[\w-]+/)
  await expect(page.getByText(/Date cible : déc\. 2026/)).toBeVisible()
  await expect(page.getByText(/Rythme suggéré/)).toBeVisible()
  await expect(page.getByText(/125\u202f000/).first()).toBeVisible() // ceil(750 000 / 6 mois)
})
