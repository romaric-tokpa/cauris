import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * ENVELOPPE CASH (Lot B4) — 100 % UI sur USER FRAIS :
 *   créer un compte Espèces → activer le mode enveloppe (plafond) → réconcilier
 *   (déclarer le reste X) → RÉCAP affiché (validation explicite) → confirmer →
 *   transaction cash créée, solde = X, date de réconciliation MAJ.
 *   Garde : X > left → message honnête visible, pas de récap.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function setup(page: Page) {
  const origin = E2E_WEB_ORIGIN
  const email = `env-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'env-demo-2026', name: 'Cashou' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })
  // Compte Espèces avec 100 000 de solde (= reste initial une fois l'enveloppe activée).
  const account = (
    (await (
      await page.request.post('/api/accounts', {
        data: { name: 'Espèces', bank: 'Enveloppe', type: 'Espèces', accountNumber: '••', balance: 100000 }, // prettier-ignore
      })
    ).json()) as { account: Account }
  ).account
  return account
}

test('Enveloppe : activer → réconcilier (récap → confirm) → dépense cash + solde MAJ', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const account = await setup(page)

  await page.goto(`/comptes/${account.id}/enveloppe`)

  // État « à activer » → on fixe un plafond.
  await page.locator('.inp.big input').fill('100000')
  await page.getByRole('button', { name: 'Activer le mode enveloppe' }).click()

  // Enveloppe active : 100 000 restants, dépensé 0.
  await expect(page.getByText(/restants/)).toBeVisible()

  // Réconciliation : déclarer le reste = 38 000.
  await page.getByRole('button', { name: /Déclarer le reste/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('.inp.big input').fill('38000')
  await dialog.getByRole('button', { name: 'Continuer' }).click()

  // RÉCAP avant confirmation (la validation explicite) : dépense de 62 000.
  await expect(dialog.getByText(/enregistrer une dépense de/)).toBeVisible()
  await expect(dialog.getByText(/62.000/)).toBeVisible()
  await dialog.getByRole('button', { name: 'Confirmer la dépense' }).click()
  await expect(dialog).toBeHidden()

  // Effet : enveloppe à 38 000, date réconciliée ; UNE dépense cash de −62 000 au ledger.
  const env = (await (await page.request.get(`/api/accounts/${account.id}/envelope`)).json()) as {
    envelope: { left: number; spent: number; lastReconciledAt: string | null }
  }
  expect(env.envelope.left).toBe(38000)
  expect(env.envelope.spent).toBe(62000)
  expect(env.envelope.lastReconciledAt).not.toBeNull()

  const txns = (await (await page.request.get('/api/transactions')).json()) as {
    transactions: { amount: number; channel: string | null; label: string }[]
  }
  const recon = txns.transactions.find((t) => t.amount === -62000)
  expect(recon?.channel).toBe('cash')
  expect(recon?.label).toBe('Réconciliation espèces')
})

test('Enveloppe : garde — reste déclaré > solde suivi → message honnête, pas de récap', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const account = await setup(page)
  // Active l'enveloppe via l'API pour aller droit à la garde.
  await page.request.post(`/api/accounts/${account.id}/envelope`, { data: { cap: 100000 } })

  await page.goto(`/comptes/${account.id}/enveloppe`)
  await page.getByRole('button', { name: /Déclarer le reste/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('.inp.big input').fill('200000') // > left (100 000)
  await dialog.getByRole('button', { name: 'Continuer' }).click()

  await expect(dialog.getByText(/dépasse le solde suivi/)).toBeVisible()
  // Pas de récap (le bouton de confirmation n'apparaît pas).
  await expect(dialog.getByRole('button', { name: /Confirmer/ })).toHaveCount(0)
})
