import { test, expect, type APIResponse } from '@playwright/test'

/**
 * CORDE DE GARDE — routes de LECTURE qui consomment la façade (analytics / dashboard /
 * accounts). Régression observée : `listBudgets` (4 colonnes ajoutées) faisait 500 sur
 * une DB non re-migrée. Ce test assure que chaque route répond 200 + structure attendue
 * sous la session d'Aïcha — il aurait capté un SELECT sur une colonne absente DU SCHÉMA,
 * un await oublié qui jette, ou une réponse cassée. (Session via storageState — smoke.)
 */

async function ok(res: APIResponse): Promise<Record<string, unknown>> {
  expect(res.status(), await res.text()).toBe(200)
  return (await res.json()) as Record<string, unknown>
}

test('GET /api/analytics → 200 + structure', async ({ request }) => {
  const d = await ok(await request.get('/api/analytics'))
  for (const k of ['period', 'kpis', 'averages', 'cashflow', 'breakdown', 'budgets']) {
    expect(d, `clé manquante: ${k}`).toHaveProperty(k)
  }
  expect(Array.isArray(d.breakdown)).toBeTruthy()
})

test('GET /api/dashboard → 200 + structure', async ({ request }) => {
  const d = await ok(await request.get('/api/dashboard'))
  for (const k of ['total', 'accounts', 'budgets']) {
    expect(d, `clé manquante: ${k}`).toHaveProperty(k)
  }
  expect(typeof d.total).toBe('number')
})

test('GET /api/accounts → 200 + structure', async ({ request }) => {
  const d = await ok(await request.get('/api/accounts'))
  expect(d).toHaveProperty('patrimoineTotal')
  expect(Array.isArray(d.accounts)).toBeTruthy()
})

test('GET /api/budgets (+ archivés) → 200', async ({ request }) => {
  expect((await request.get('/api/budgets')).status()).toBe(200)
  expect((await request.get('/api/budgets?archived=true')).status()).toBe(200)
})
