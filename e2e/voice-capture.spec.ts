import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * NOTE VOCALE (Lot B2) — flux RÉEL derrière un STT SIMULÉ, 100 % UI sur USER FRAIS :
 *   A. CHEMIN HEUREUX (compte « Wave » existe) → simulation honnête (badge Simulation,
 *      jamais « écoute en cours ») → champs extraits → Valider → transaction créée (canal wave).
 *   B. CHEMIN NON RÉSOLU (aucun compte « Wave ») → compte non résolu → « Valider » DÉSACTIVÉ
 *      + renvoi vers « Corriger » → formulaire pré-rempli (montant + canal Wave, compte à choisir)
 *      → on choisit un compte → enregistré. Aussi soigné que le chemin heureux.
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
        data: { email, password: 'voice-demo-2026', name: 'Voix' },
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
    transactions: { label: string; amount: number; channel: string | null; accountId: string }[]
  }).transactions

test('Note vocale — chemin heureux : simulation honnête → Valider → transaction créée (canal wave)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'voiceok')
  await makeAccount(page, 'Wave', 'Mobile money', 'Mobile money')

  await page.goto('/transactions?new=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  // Entrée Note vocale (rangée Capture rapide).
  await dialog.getByRole('button', { name: /Note vocale/ }).click()

  // Honnêteté du stub : badge « Simulation » présent, AUCUN faux « écoute en cours ».
  await expect(dialog.getByText('Simulation', { exact: true })).toBeVisible()
  await expect(dialog.getByText(/écoute en cours/i)).toHaveCount(0)

  // Lancer la transcription simulée → la phrase canonique apparaît.
  await dialog.getByRole('button', { name: /Lancer la simulation/ }).click()
  await expect(dialog.getByText(/Wave 3 500 pour le déjeuner/)).toBeVisible()

  // Étape de vérification : champs extraits + Valider actif.
  await expect(dialog.getByText('Champs extraits')).toBeVisible()
  const valider = dialog.getByRole('button', { name: /Valider/ })
  await expect(valider).toBeEnabled()
  await valider.click()
  await expect(dialog).toBeHidden()

  // Effet : transaction réelle créée (Dépense −3500, canal wave).
  const txns = await listTxns(page)
  const created = txns.find((t) => t.amount === -3500)
  expect(created?.channel).toBe('wave')
  expect(created?.label).toBe('Déjeuner')
})

test('Note vocale — chemin NON RÉSOLU : Valider désactivé → Corriger → form pré-rempli → enregistré', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await freshUser(page, 'voicenr')
  // Aucun compte nommé « Wave » → extractDraft ne résout pas le compte.
  const nsia = await makeAccount(page, 'Compte courant', 'NSIA Banque', 'Trésorerie')

  await page.goto('/transactions?new=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Note vocale/ }).click()
  await dialog.getByRole('button', { name: /Lancer la simulation/ }).click()
  await expect(dialog.getByText(/Wave 3 500 pour le déjeuner/)).toBeVisible()

  // Garde anti-inerte : compte non résolu → « À choisir » + indice + Valider DÉSACTIVÉ.
  await expect(dialog.getByText('À choisir')).toBeVisible()
  await expect(dialog.getByText(/Compte non reconnu/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: /Valider/ })).toBeDisabled()

  // Corriger → formulaire pré-rempli : montant 3 500 + canal Wave actif + compte à choisir.
  await dialog.getByRole('button', { name: /Corriger/ }).click()
  await expect(dialog.locator('.inp.big input')).toHaveValue(/3.500/)
  const channel = dialog.getByRole('group', { name: 'Canal de paiement' })
  await expect(channel.getByRole('button', { name: 'Wave', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(dialog.getByLabel('Compte')).toHaveValue('')

  // L'utilisateur choisit son compte → enregistre.
  await dialog.getByLabel('Compte').selectOption({ label: 'Compte courant' })
  await dialog.getByRole('button', { name: /Ajouter/ }).click()
  await expect(dialog).toBeHidden()

  // Effet : transaction créée sur le compte choisi, canal dicté conservé (wave).
  const txns = await listTxns(page)
  const created = txns.find((t) => t.amount === -3500)
  expect(created?.channel).toBe('wave')
  expect(created?.accountId).toBe(nsia.id)
})
