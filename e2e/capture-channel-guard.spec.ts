import { test, expect, type APIRequestContext } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * GARDE SERVEUR — canal de paiement (Lot B1, liste FERMÉE { wave, orange_money, cash, banque }) :
 *  - Dépense avec canal HORS-liste ('mtn') → 400 (rejet du fantôme) ;
 *  - Dépense SANS canal → 400 (champ requis pour Dépense/Revenu) ;
 *  - Transfert → canal forcé à NULL même si le client en envoie un (mouvement interne) ;
 *  - Dépense avec canal valide → 201 + stocké.
 * User frais → zéro impact baselines Aïcha.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Account {
  id: string
}

async function freshUser(request: APIRequestContext) {
  const origin = E2E_WEB_ORIGIN
  const email = `chanapi-${Date.now()}@cauris.demo`
  expect(
    (
      await request.post('/api/auth/sign-up/email', {
        data: { email, password: 'chan-demo-2026', name: 'ApiCanal' },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await request.post('/api/onboarding/complete', { headers: { origin } })
}

const newAccount = async (request: APIRequestContext, name: string) =>
  (
    (await (
      await request.post('/api/accounts', {
        data: { name, bank: 'NSIA Banque', type: 'Trésorerie', accountNumber: '00', balance: 0 },
      })
    ).json()) as { account: Account }
  ).account

test('Canal : 400 hors-liste / 400 manquant / Transfert→null / 201 valide', async ({ request }) => {
  await freshUser(request)
  const a = await newAccount(request, 'Source')
  const b = await newAccount(request, 'Destination')

  // Canal hors-liste → 400.
  const phantom = await request.post('/api/transactions', {
    data: { type: 'Dépense', label: 'X', amount: 1000, occurredAt: '2026-06-02', accountId: a.id, channel: 'mtn' }, // prettier-ignore
  })
  expect(phantom.status()).toBe(400)
  expect(((await phantom.json()) as { error: string }).error).toMatch(/canal/i)

  // Canal manquant sur une Dépense → 400.
  const missing = await request.post('/api/transactions', {
    data: { type: 'Dépense', label: 'X', amount: 1000, occurredAt: '2026-06-02', accountId: a.id },
  })
  expect(missing.status()).toBe(400)
  expect(((await missing.json()) as { error: string }).error).toMatch(/canal/i)

  // Transfert avec un canal envoyé → ignoré, stocké null.
  const tr = await request.post('/api/transactions', {
    data: { type: 'Transfert', label: 'Vir', amount: 2000, occurredAt: '2026-06-02', accountId: a.id, transferAccountId: b.id, channel: 'wave' }, // prettier-ignore
  })
  expect(tr.status()).toBe(201)
  expect(((await tr.json()) as { transaction: { channel: string | null } }).transaction.channel).toBeNull() // prettier-ignore

  // Canal valide sur une Dépense → 201 + stocké.
  const ok = await request.post('/api/transactions', {
    data: { type: 'Dépense', label: 'Y', amount: 1500, occurredAt: '2026-06-02', accountId: a.id, channel: 'wave' }, // prettier-ignore
  })
  expect(ok.status()).toBe(201)
  expect(((await ok.json()) as { transaction: { channel: string | null } }).transaction.channel).toBe('wave') // prettier-ignore
})
