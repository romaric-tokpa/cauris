import { test, expect } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * MODÈLE B — scénario DYNAMIQUE (celui vécu par l'utilisateur), de bout en bout.
 * Nouvel user → Espèces 140 200 + Wave 0 → transfert 20 000 Espèces→Wave →
 * Espèces 120 200 / Wave 20 000 / patrimoine INCHANGÉ → dépense 20 000 sur Wave → Wave 0.
 *
 * Les MUTATIONS passent par l'UI réelle (drawers) ; les soldes DÉRIVÉS sont vérifiés
 * via l'API (robuste, pas de matching de texte formaté). User frais → zéro baseline.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Acct { id: string; name: string; balance: number | null }

test('Modèle B : transfert et dépense recalculent les soldes dérivés', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const origin = E2E_WEB_ORIGIN
  const email = `derived-${Date.now()}@cauris.demo`

  const signup = await page.request.post('/api/auth/sign-up/email', {
    data: { email, password: 'derived-2026', name: 'Derived' },
    headers: { origin },
  })
  expect(signup.ok()).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })

  const fetchAccounts = async (): Promise<{ accounts: Acct[]; patrimoineTotal: number }> =>
    (await (await page.request.get('/api/accounts')).json()) as {
      accounts: Acct[]
      patrimoineTotal: number
    }
  const accounts = async (): Promise<Acct[]> => (await fetchAccounts()).accounts
  const netWorth = async (): Promise<number> => (await fetchAccounts()).patrimoineTotal
  const byName = (list: Acct[], n: string) => list.find((a) => a.name === n)!

  // Créer un compte via le drawer.
  const createAccount = async (name: string, type: string, amount: string) => {
    await page.goto('/comptes')
    await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Ajouter un compte' }).click()
    const d = page.getByRole('dialog')
    await expect(d).toBeVisible()
    await d.getByRole('button', { name: type, exact: true }).click()
    await d.getByRole('textbox', { name: 'Nom du compte' }).fill(name)
    await d.locator('.inp.big input').fill(amount)
    await d.getByRole('button', { name: /Ajouter/ }).click()
    await expect(d).toBeHidden()
  }

  await createAccount('Espèces perso', 'Espèces', '140200')
  await createAccount('Wave perso', 'Mobile money', '0')

  let list = await accounts()
  const esp = byName(list, 'Espèces perso')
  const wave = byName(list, 'Wave perso')
  expect(esp.balance).toBe(140200)
  expect(wave.balance).toBe(0)
  expect(await netWorth()).toBe(140200)

  // Transfert 20 000 Espèces → Wave (drawer transaction).
  await page.goto('/transactions')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()
  let d = page.getByRole('dialog')
  await d.getByRole('button', { name: 'Transfert', exact: true }).click()
  await d.locator('.inp.big input').fill('20000')
  await d.getByLabel('Depuis').selectOption(esp.id)
  await d.getByLabel('Vers').selectOption(wave.id)
  await d.getByRole('button', { name: 'Transférer' }).click()
  await expect(d).toBeHidden()

  list = await accounts()
  expect(byName(list, 'Espèces perso').balance).toBe(120200) // 140 200 − 20 000
  expect(byName(list, 'Wave perso').balance).toBe(20000) // 0 + 20 000
  expect(await netWorth()).toBe(140200) // INVARIANT : transfert interne ne change pas le patrimoine

  // Dépense 20 000 sur Wave.
  await page.goto('/transactions')
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Ajouter une transaction/i }).click()
  d = page.getByRole('dialog')
  await d.getByRole('textbox', { name: 'Libellé' }).fill('Achat')
  await d.locator('.inp.big input').fill('20000')
  await d.getByLabel('Compte').selectOption(wave.id)
  await d.getByRole('button', { name: /Ajouter/ }).click()
  await expect(d).toBeHidden()

  list = await accounts()
  expect(byName(list, 'Wave perso').balance).toBe(0) // 20 000 − 20 000
  expect(await netWorth()).toBe(120200) // dépense réduit le patrimoine
})
