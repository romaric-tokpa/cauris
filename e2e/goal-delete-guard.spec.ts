import { test, expect, type APIRequestContext } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * GARDE SERVEUR (défense en profondeur, au-delà de l'UI) sur la suppression d'objectif :
 *  - sans session → 401 ; objectif d'autrui → 404 ;
 *  - objectif AVEC contribution → 409 (jamais détruire un historique) ;
 *  - objectif VIDE (0 contribution) → 200. User frais → zéro impact baseline Aïcha.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Goal {
  id: string
}

async function freshUser(request: APIRequestContext, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}@cauris.demo`
  expect(
    (
      await request.post('/api/auth/sign-up/email', {
        data: { email, password: 'goal-demo-2026', name: tag },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await request.post('/api/onboarding/complete', { headers: { origin } })
}

test('Suppression objectif : 401 / 404 / 409 (contribué) / 200 (vide)', async ({
  request,
  playwright,
}) => {
  // Contexte anonyme (aucun cookie) → 401.
  const anon = await playwright.request.newContext()
  expect((await anon.delete('/api/goals/whatever')).status()).toBe(401)
  await anon.dispose()

  await freshUser(request, 'guard')

  // Objectif contribué → 409 (archiver plutôt).
  const contributed = (
    (await (
      await request.post('/api/goals', { data: { name: 'Contribué', targetAmount: 300000 } })
    ).json()) as { goal: Goal }
  ).goal
  await request.post(`/api/goals/${contributed.id}/contributions`, {
    data: { amount: 50000, occurredAt: '2026-06-01' },
  })
  const refused = await request.delete(`/api/goals/${contributed.id}`)
  expect(refused.status()).toBe(409)
  expect(((await refused.json()) as { error: string }).error).toMatch(/archiv/i)

  // Objectif vide → 200.
  const empty = (
    (await (
      await request.post('/api/goals', { data: { name: 'Vide', targetAmount: 100000 } })
    ).json()) as { goal: Goal }
  ).goal
  expect((await request.delete(`/api/goals/${empty.id}`)).status()).toBe(200)

  // Objectif d'autrui → 404 (le contribué appartient à l'user 1 ; un user 2 ne le voit pas).
  const other = await playwright.request.newContext()
  const origin = E2E_WEB_ORIGIN
  await other.post('/api/auth/sign-up/email', {
    data: { email: `guard2-${Date.now()}@cauris.demo`, password: 'goal-demo-2026', name: 'G2' },
    headers: { origin },
  })
  await other.post('/api/onboarding/complete', { headers: { origin } })
  expect((await other.delete(`/api/goals/${contributed.id}`)).status()).toBe(404)
  await other.dispose()
})
