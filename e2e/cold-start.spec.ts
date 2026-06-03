import { test, expect } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * TEST CLÉ — COLD START (LOT A v2 / CRUD Comptes).
 * Un NOUVEL utilisateur (0 compte) doit pouvoir : créer son 1er compte → le
 * `NoAccountNotice` du formulaire transaction DISPARAÎT (formReady passe à true) →
 * créer une transaction. On exerce aussi blocage/déblocage (masquage ••• •••).
 *
 * Tout se passe sur un user FRAÎCHEMENT inscrit (≠ Aïcha) → zéro impact sur les
 * baselines de fidélité (scopées Aïcha). Pas de storageState d'Aïcha ici.
 */
test.use({ storageState: { cookies: [], origins: [] } })

test('cold start : nouvel utilisateur → 1er compte → NoAccountNotice disparaît → transaction OK', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const origin = E2E_WEB_ORIGIN
  const email = `cold-${Date.now()}@cauris.demo`

  // Inscription + onboarding terminé via API (la session/cookie vit dans le contexte).
  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { email, password: 'cold-demo-2026', name: 'Cold Start' },
    headers: { origin },
  })
  expect(signup.ok()).toBeTruthy()
  const done = await page.request.post('/api/onboarding/complete', { headers: { origin } })
  expect(done.ok()).toBeTruthy()

  // 1) Sans compte : « Ajouter une transaction » ouvre le garde-fou NoAccountNotice.
  await page.goto('/transactions')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()
  const txnDialog = page.getByRole('dialog')
  await expect(txnDialog.getByText(/Ajoutez d'abord un compte/)).toBeVisible()

  // Le lien « Créer un compte » du garde-fou mène à /comptes.
  await txnDialog.getByRole('link', { name: /Créer un compte/ }).click()
  await expect(page).toHaveURL(/\/comptes/)

  // 2) Créer le 1er compte.
  await page.getByRole('button', { name: 'Ajouter un compte' }).click()
  const accDialog = page.getByRole('dialog')
  await expect(accDialog).toBeVisible()
  await accDialog.getByRole('textbox', { name: 'Nom du compte' }).fill('Mon NSIA')
  await accDialog.locator('.inp.big input').fill('75000')
  await accDialog.getByRole('button', { name: /Ajouter/ }).click()
  await expect(accDialog).toBeHidden()
  await expect(page.getByText('Mon NSIA').first()).toBeVisible()

  // 3) Blocage → solde masqué ••• ••• + badge « Bloqué » ; puis déblocage → restauré.
  await page.getByRole('button', { name: 'Bloquer Mon NSIA' }).click()
  // « Bloqué » EXACT (le badge) — pas l'onglet « Bloqués ».
  await expect(page.getByText('Bloqué', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('••• •••').first()).toBeVisible()
  await page.getByRole('button', { name: 'Débloquer Mon NSIA' }).click()
  await expect(page.getByText('Bloqué', { exact: true })).toHaveCount(0)

  // 4) formReady=true : « Ajouter une transaction » ouvre le VRAI formulaire (plus le garde-fou).
  await page.goto('/transactions')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()
  const form = page.getByRole('dialog')
  await expect(form.getByText(/Ajoutez d'abord un compte/)).toHaveCount(0)
  await expect(form.getByRole('textbox', { name: 'Libellé' })).toBeVisible()

  // 5) Créer une transaction → succès (drawer fermé).
  await form.getByRole('textbox', { name: 'Libellé' }).fill('Première dépense')
  await form.locator('.inp.big input').fill('5000')
  await form.getByRole('button', { name: /Ajouter/ }).click()
  await expect(form).toBeHidden()
})
