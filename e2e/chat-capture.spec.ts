import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * SAISIE CONVERSATIONNELLE (Lot B3) — texte libre → brouillon partagé (DraftReview).
 * 100 % UI sur USER FRAIS :
 *   A. RÉSOLU — compte « Orange Money » → « Orange Money 25000 pour le courant » →
 *      Enregistrer → transaction créée (canal orange_money, −25 000).
 *   B. NON RÉSOLU = CAS NORMAL — texte sans compte reconnaissable → Enregistrer DÉSACTIVÉ
 *      → Modifier → formulaire pré-rempli (montant) → on choisit le compte → enregistré.
 *   C. CHIP — une suggestion remplit + envoie (bulle IA apparaît).
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function freshUser(page: Page, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'chat-demo-2026', name: 'Causette' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })
}

const makeAccount = async (page: Page, name: string, bank: string, type: string) =>
  (
    (await (
      await page.request.post('/api/accounts', {
        data: { name, bank, type, accountNumber: '00', balance: 0 },
      })
    ).json()) as { account: Account }
  ).account

const listTxns = async (page: Page) =>
  ((await (await page.request.get('/api/transactions')).json()) as {
    transactions: { amount: number; channel: string | null; accountId: string }[]
  }).transactions

async function openChat(page: Page) {
  await page.goto('/transactions?new=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Langage naturel/ }).click()
  return dialog
}

test('Chat — chemin résolu : phrase → Enregistrer → transaction (orange_money, −25 000)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'chatok')
  await makeAccount(page, 'Orange Money', 'Mobile money', 'Mobile money')

  const dialog = await openChat(page)
  await dialog.getByRole('textbox', { name: 'Votre question' }).fill('Orange Money 25000 pour le courant') // prettier-ignore
  await dialog.getByRole('button', { name: 'Envoyer' }).click()

  // Bulle IA (étiquetée « C ») + brouillon partagé.
  await expect(dialog.getByText(/préparé cette transaction/)).toBeVisible()
  await expect(dialog.getByText('Champs extraits')).toBeVisible()
  const enregistrer = dialog.getByRole('button', { name: 'Enregistrer' })
  await expect(enregistrer).toBeEnabled()
  await enregistrer.click()
  await expect(dialog).toBeHidden()

  const created = (await listTxns(page)).find((t) => t.amount === -25000)
  expect(created?.channel).toBe('orange_money')
})

test('Chat — NON RÉSOLU (normal) : Enregistrer désactivé → Modifier → form pré-rempli → enregistré', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'chatnr')
  const nsia = await makeAccount(page, 'Compte courant', 'NSIA Banque', 'Trésorerie')

  const dialog = await openChat(page)
  await dialog
    .getByRole('textbox', { name: 'Votre question' })
    .fill("J'ai reçu 150000 sur mon compte principal")
  await dialog.getByRole('button', { name: 'Envoyer' }).click()
  await expect(dialog.getByText(/préparé cette transaction/)).toBeVisible()

  // Garde anti-inerte : compte non reconnu → Enregistrer DÉSACTIVÉ + renvoi vers Modifier.
  await expect(dialog.getByText('À choisir')).toBeVisible()
  await expect(dialog.getByText(/Compte non reconnu/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()

  // Modifier → formulaire pré-rempli (montant 150 000, type Revenu).
  await dialog.getByRole('button', { name: 'Modifier' }).click()
  await expect(dialog.locator('.inp.big input')).toHaveValue(/150.000/)
  await expect(dialog.getByLabel('Compte')).toHaveValue('')

  // L'utilisateur choisit son compte → enregistre.
  await dialog.getByLabel('Compte').selectOption({ label: 'Compte courant' })
  await dialog.getByRole('button', { name: /Ajouter/ }).click()
  await expect(dialog).toBeHidden()

  const created = (await listTxns(page)).find((t) => t.amount === 150000) // Revenu → positif
  expect(created?.accountId).toBe(nsia.id)
})

test('Chat — une suggestion remplit + envoie', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'chatchip')
  await makeAccount(page, 'Wave', 'Mobile money', 'Mobile money')

  const dialog = await openChat(page)
  await dialog.getByRole('button', { name: 'Reçu 150000 salaire' }).click()
  await expect(dialog.getByText(/préparé cette transaction/)).toBeVisible()
})
