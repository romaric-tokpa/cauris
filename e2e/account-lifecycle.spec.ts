import { test, expect, type Page } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * CYCLE DE VIE COMPTE (point 3) — interactions UI sur USER FRAIS (zéro baseline Aïcha) :
 *   A. compte RÉFÉRENCÉ (une opération) → « Supprimer » ABSENT, « Archiver » présent →
 *      archivé → disparu de la liste.
 *   B. compte LIBRE (0 opération) → « Supprimer ce compte » présent → supprimé → disparu.
 * Setup des comptes via l'API (comme les tests objectifs) ; les actions sont 100 % UI.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function setup(page: Page) {
  const origin = E2E_WEB_ORIGIN
  const email = `acctlife-${Date.now()}@cauris.demo`
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        data: { email, password: 'acct-demo-2026', name: 'Lifer' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await page.request.post('/api/onboarding/complete', { headers: { origin } })

  const make = async (name: string) =>
    (
      (await (
        await page.request.post('/api/accounts', {
          data: { name, bank: 'Ecobank', type: 'Trésorerie', accountNumber: '12', balance: 0 },
        })
      ).json()) as { account: Account }
    ).account

  const used = await make('Compte utilisé')
  const libre = await make('Compte libre')
  // Une opération référence « Compte utilisé » → non supprimable (archivable).
  await page.request.post('/api/transactions', {
    data: { type: 'Dépense', label: 'Achat', amount: 3000, occurredAt: '2026-05-02', accountId: used.id, channel: 'cash' }, // prettier-ignore
  })
  return { used, libre }
}

test('Compte : archiver (référencé) vs supprimer (libre) — 100 % UI', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  const { used, libre } = await setup(page)

  // ── A. Compte référencé → Supprimer absent, Archiver présent → archivé.
  await page.goto(`/comptes/${used.id}`)
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Modifier/ }).first().click()
  let edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await expect(edit.getByRole('button', { name: 'Supprimer ce compte' })).toHaveCount(0)
  await edit.getByRole('button', { name: /Archiver ce compte/ }).click()
  await expect(page).toHaveURL(/\/comptes$/)
  await expect(page.getByText('Compte utilisé')).toHaveCount(0)

  // ── B. Compte libre → Supprimer présent → supprimé.
  await page.goto(`/comptes/${libre.id}`)
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible' })
  await page.getByRole('button', { name: /Modifier/ }).first().click()
  edit = page.getByRole('dialog')
  await expect(edit).toBeVisible()
  await edit.getByRole('button', { name: 'Supprimer ce compte' }).click()
  await expect(page).toHaveURL(/\/comptes$/)
  await expect(page.getByText('Compte libre')).toHaveCount(0)
})
