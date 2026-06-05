import { test, expect, type APIRequestContext } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * GARDE SERVEUR — création de prêt (frontière de confiance). La MATH vient du client ;
 * le serveur valide les INVARIANTS (sommes/cohérence), jamais la formule :
 *  - 401 sans session ; échéancier valide → 201 ;
 *  - Σ amortissements ≠ capital → 400 (l'invariant clé) ;
 *  - dernier reste ≠ 0 → 400 ;
 *  - suppression d'un prêt d'autrui → 404.
 * User frais → zéro impact baselines Aïcha.
 */
test.use({ storageState: { cookies: [], origins: [] } })

async function freshUser(request: APIRequestContext, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@cauris.demo`
  expect(
    (await request.post('/api/auth/sign-up/email', { data: { email, password: 'loan-2026', name: tag }, headers: { origin } })).ok(), // prettier-ignore
  ).toBeTruthy()
  await request.post('/api/onboarding/complete', { headers: { origin } })
}

/** Prêt simple valide : capital 1000, 2 échéances amort 500/500. */
function validPayload() {
  return {
    name: 'Test prêt',
    kind: 'Conso',
    principal: 1000,
    rateBps: 1200,
    taxBps: 0,
    insuranceBps: 0,
    feesUpfront: 0,
    termMonths: 2,
    monthlyPayment: 510,
    firstDueDate: '2026-07-25',
    firstPeriodDays: 30,
    schedule: [
      { n: 1, interest: 10, tax: 0, insurance: 0, principal: 500, payment: 510, remainingAfter: 500 },
      { n: 2, interest: 5, tax: 0, insurance: 0, principal: 500, payment: 505, remainingAfter: 0 },
    ],
  }
}

test('POST /loans : 401 / 201 valide / 400 (Σ≠capital) / 400 (reste final≠0)', async ({ request, playwright }) => {
  const anon = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } })
  expect((await anon.post('/api/loans', { data: validPayload() })).status()).toBe(401)
  await anon.dispose()

  await freshUser(request, 'loan')

  // Échéancier valide → 201.
  expect((await request.post('/api/loans', { data: validPayload() })).status()).toBe(201)

  // Σ amortissements ≠ capital (l'invariant clé) → 400.
  const bad = validPayload()
  bad.schedule[0].principal = 400 // Σ = 900 ≠ 1000
  bad.schedule[0].remainingAfter = 600
  const r1 = await request.post('/api/loans', { data: bad })
  expect(r1.status()).toBe(400)
  expect(((await r1.json()) as { error: string }).error).toMatch(/capital/i)

  // Dernier reste ≠ 0 → 400.
  const bad2 = validPayload()
  bad2.schedule[1].remainingAfter = 50
  expect((await request.post('/api/loans', { data: bad2 })).status()).toBe(400)
})

test('DELETE /loans/:id d’autrui → 404', async ({ request, playwright }) => {
  await freshUser(request, 'lA')
  const created = (await (await request.post('/api/loans', { data: validPayload() })).json()) as { loan: { id: string } } // prettier-ignore

  const other = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } })
  await freshUser(other, 'lB')
  expect((await other.delete(`/api/loans/${created.loan.id}`)).status()).toBe(404)
  await other.dispose()
})
