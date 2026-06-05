import { test, expect, type APIRequestContext } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * GARDE SERVEUR Comptes (cycle de vie) — défense en profondeur + sémantique patrimoine :
 *  - sans session → 401 ; compte d'autrui → 404 ;
 *  - DELETE d'un compte RÉFÉRENCÉ par une opération → 409 (archiver plutôt) ;
 *  - DELETE d'un compte libre (0 réf) → 200 ;
 *  - ARCHIVÉ → sort de la liste ET du patrimoine ; DÉSARCHIVÉ → réintégré (réversible).
 * User frais → zéro impact baselines Aïcha.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
  balance: number | null
}

async function freshUser(request: APIRequestContext, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}@cauris.demo`
  expect(
    (
      await request.post('/api/auth/sign-up/email', {
        data: { email, password: 'acct-demo-2026', name: tag },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await request.post('/api/onboarding/complete', { headers: { origin } })
}

const newAccount = async (request: APIRequestContext, name: string, balance = 0) =>
  (
    (await (
      await request.post('/api/accounts', {
        data: { name, bank: 'NSIA Banque', type: 'Trésorerie', accountNumber: '00', balance },
      })
    ).json()) as { account: Account }
  ).account

const patrimoine = async (request: APIRequestContext) =>
  ((await (await request.get('/api/accounts')).json()) as { patrimoineTotal: number }).patrimoineTotal

test('Comptes : 401 / 404 / 409 (référencé) / 200 (libre)', async ({ request, playwright }) => {
  const anon = await playwright.request.newContext()
  expect((await anon.delete('/api/accounts/whatever')).status()).toBe(401)
  await anon.dispose()

  await freshUser(request, 'acct')

  // Compte libre → DELETE 200.
  const libre = await newAccount(request, 'Libre')
  expect((await request.delete(`/api/accounts/${libre.id}`)).status()).toBe(200)

  // Compte référencé par une opération → DELETE 409.
  const used = await newAccount(request, 'Utilisé')
  await request.post('/api/transactions', {
    data: { type: 'Dépense', label: 'Test', amount: 5000, occurredAt: '2026-05-01', accountId: used.id, channel: 'cash' }, // prettier-ignore
  })
  const refused = await request.delete(`/api/accounts/${used.id}`)
  expect(refused.status()).toBe(409)
  expect(((await refused.json()) as { error: string }).error).toMatch(/archiv/i)

  // Compte d'autrui → 404.
  const other = await playwright.request.newContext()
  const origin = E2E_WEB_ORIGIN
  await other.post('/api/auth/sign-up/email', {
    data: { email: `acct2-${Date.now()}@cauris.demo`, password: 'acct-demo-2026', name: 'A2' },
    headers: { origin },
  })
  await other.post('/api/onboarding/complete', { headers: { origin } })
  expect((await other.delete(`/api/accounts/${used.id}`)).status()).toBe(404)
  await other.dispose()
})

test('Comptes : archivé sort du patrimoine, désarchivé réintégré (réversible)', async ({ request }) => {
  await freshUser(request, 'patri')

  const base = await patrimoine(request)
  const c = await newAccount(request, 'À clôturer', 500000)
  expect(await patrimoine(request)).toBe(base + 500000)

  // Archiver → sort de la liste ET du patrimoine.
  expect((await request.post(`/api/accounts/${c.id}/archive`)).status()).toBe(200)
  expect(await patrimoine(request)).toBe(base)
  const list = (await (await request.get('/api/accounts')).json()) as { accounts: Account[] }
  expect(list.accounts.some((a) => a.id === c.id)).toBe(false)

  // Désarchiver → réintégré (réversible, solde intact).
  expect((await request.post(`/api/accounts/${c.id}/unarchive`)).status()).toBe(200)
  expect(await patrimoine(request)).toBe(base + 500000)
})
