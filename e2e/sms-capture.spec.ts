import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * CAPTURE SMS (Lot B5) — boîte SMS SIMULÉE → extraction partagée → DraftReview. 100 % UI :
 *   A. RÉSOLU — compte « Wave » → « Depuis un SMS » → badge Simulation → Vérifier le SMS Wave
 *      → Ajouter → transaction (canal wave, −3 500).
 *   B. NON RÉSOLU — sans compte « Wave » → Ajouter désactivé → Modifier → form pré-rempli →
 *      compte choisi → enregistré.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function freshUser(page: Page, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'sms-demo-2026', name: 'Smsou' },
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

async function openSms(page: Page) {
  await page.goto('/transactions?new=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Depuis un SMS/ }).click()
  return dialog
}

test('SMS — chemin résolu : badge Simulation → Vérifier → Ajouter → transaction (wave, −3 500)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'smsok')
  await makeAccount(page, 'Wave', 'Mobile money', 'Mobile money')

  const dialog = await openSms(page)
  // Honnêteté : badge « Simulation », aucune lecture réelle.
  await expect(dialog.getByText('Simulation', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/sans lecture réelle/)).toBeVisible()
  await expect(dialog.getByText(/Resto Belleville/)).toBeVisible()

  // Vérifier le 1er SMS (Wave) → revue partagée.
  await dialog.getByRole('button', { name: 'Vérifier' }).first().click()
  await expect(dialog.getByText('Champs extraits')).toBeVisible()
  const ajouter = dialog.getByRole('button', { name: 'Ajouter', exact: true })
  await expect(ajouter).toBeEnabled()
  await ajouter.click()
  await expect(dialog).toBeHidden()

  const created = (await listTxns(page)).find((t) => t.amount === -3500)
  expect(created?.channel).toBe('wave')
})

test('SMS — NON RÉSOLU : Ajouter désactivé → Modifier → form pré-rempli → enregistré', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'smsnr')
  const nsia = await makeAccount(page, 'Compte courant', 'NSIA Banque', 'Trésorerie')

  const dialog = await openSms(page)
  await dialog.getByRole('button', { name: 'Vérifier' }).first().click()

  await expect(dialog.getByText('À choisir')).toBeVisible()
  await expect(dialog.getByText(/Compte non reconnu/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Ajouter', exact: true })).toBeDisabled()

  // Modifier → form pré-rempli (montant 3 500, canal Wave actif) → on choisit le compte.
  await dialog.getByRole('button', { name: 'Modifier' }).click()
  await expect(dialog.locator('.inp.big input')).toHaveValue(/3.500/)
  const channel = dialog.getByRole('group', { name: 'Canal de paiement' })
  await expect(channel.getByRole('button', { name: 'Wave', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await dialog.getByLabel('Compte').selectOption({ label: 'Compte courant' })
  await dialog.getByRole('button', { name: /Ajouter/ }).click()
  await expect(dialog).toBeHidden()

  const created = (await listTxns(page)).find((t) => t.amount === -3500)
  expect(created?.channel).toBe('wave')
  expect(created?.accountId).toBe(nsia.id)
})
