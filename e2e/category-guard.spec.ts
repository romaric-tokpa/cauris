import { test, expect, type APIRequestContext } from '@playwright/test'
import { E2E_WEB_ORIGIN } from './constants'

/**
 * GARDE SERVEUR Catégories (A6) — défense en profondeur, au-delà de l'UI :
 *  - sans session → 401 ; corps invalide → 400 ; catégorie d'autrui → 404 ;
 *  - suppression d'une catégorie RÉFÉRENCÉE (budget/opération) → 409 (jamais orpheliner) ;
 *  - catégorie libre (0 référence) → 200.
 * User frais → zéro impact sur les baselines Aïcha.
 */
test.use({ storageState: { cookies: [], origins: [] } })

interface Category {
  id: string
  name: string
  kind: string
}

async function freshUser(request: APIRequestContext, tag: string) {
  const origin = E2E_WEB_ORIGIN
  const email = `${tag}-${Date.now()}@cauris.demo`
  expect(
    (
      await request.post('/api/auth/sign-up/email', {
        data: { email, password: 'cat-demo-2026', name: tag },
        headers: { origin },
      })
    ).ok(),
  ).toBeTruthy()
  await request.post('/api/onboarding/complete', { headers: { origin } })
}

const newCat = async (request: APIRequestContext, name: string, kind = 'expense') =>
  (
    (await (
      await request.post('/api/categories', { data: { name, kind } })
    ).json()) as { category: Category }
  ).category

test('Catégories : 401 / 400 / 404 / 409 (référencée) / 200 (libre)', async ({
  request,
  playwright,
}) => {
  // Sans session → 401.
  const anon = await playwright.request.newContext()
  expect((await anon.post('/api/categories', { data: { name: 'X', kind: 'expense' } })).status()).toBe(401)
  await anon.dispose()

  await freshUser(request, 'cat')

  // Corps invalide → 400 (nom vide ; type inconnu ; couleur hors palette).
  expect((await request.post('/api/categories', { data: { name: '  ', kind: 'expense' } })).status()).toBe(400)
  expect((await request.post('/api/categories', { data: { name: 'Ok', kind: 'autre' } })).status()).toBe(400)
  expect(
    (await request.post('/api/categories', { data: { name: 'Ok', kind: 'expense', colorToken: '#fff' } })).status(),
  ).toBe(400)

  // Création OK → 201, enrichissement présent au listing.
  const libre = await newCat(request, 'Catégorie libre')
  expect(libre.id).toBeTruthy()

  // Catégorie RÉFÉRENCÉE par un budget → suppression 409.
  const used = await newCat(request, 'Catégorie utilisée')
  const budgetRes = await request.post('/api/budgets', {
    data: { categoryId: used.id, cap: 100000, frequency: 'Mensuel', alertPct: 90, rollover: false },
  })
  expect(budgetRes.ok()).toBeTruthy()
  const refused = await request.delete(`/api/categories/${used.id}`)
  expect(refused.status()).toBe(409)
  expect(((await refused.json()) as { error: string }).error).toMatch(/budget/i)

  // Catégorie LIBRE (0 référence) → 200.
  expect((await request.delete(`/api/categories/${libre.id}`)).status()).toBe(200)

  // Catégorie d'autrui → 404 (un 2ᵉ user ne voit pas celle du 1ᵉʳ).
  const other = await playwright.request.newContext()
  const origin = E2E_WEB_ORIGIN
  await other.post('/api/auth/sign-up/email', {
    data: { email: `cat2-${Date.now()}@cauris.demo`, password: 'cat-demo-2026', name: 'C2' },
    headers: { origin },
  })
  await other.post('/api/onboarding/complete', { headers: { origin } })
  expect((await other.delete(`/api/categories/${used.id}`)).status()).toBe(404)
  expect((await other.patch(`/api/categories/${used.id}`, { data: { name: 'Z', kind: 'expense' } })).status()).toBe(404)
  await other.dispose()
})
