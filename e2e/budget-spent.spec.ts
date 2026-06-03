import { test, expect } from '@playwright/test'

/**
 * Règle « spent d'un budget NEUF » (décision A, sans casser Phase 6) :
 *  - budget créé sur une catégorie DÉJÀ consommée ce mois → `spent` = dépenses RÉELLES
 *    dérivées de la catégorie (≠ 0, pas de 0 % trompeur) ;
 *  - les budgets SEEDÉS d'Aïcha gardent leur enveloppe stockée (Transport 108 %).
 * Le budget créé est ARCHIVÉ en fin de test (pas de DELETE budget) → liste active restaurée.
 */

interface Cat { id: string; name: string }
interface BreakdownRow { categoryId: string; amount: number }
interface BudgetRow { id: string; categoryId: string; spent: number; cap: number; pct: number }

test('Budget neuf : spent = dépenses dérivées de la catégorie (≠ 0)', async ({ request }) => {
  const cats = (
    (await (await request.get('/api/categories')).json()) as { categories: Cat[] }
  ).categories
  const alim = cats.find((c) => c.name === 'Alimentation')!

  const ana = (await (await request.get('/api/analytics')).json()) as {
    breakdown: BreakdownRow[]
  }
  const derived = ana.breakdown.find((b) => b.categoryId === alim.id)?.amount ?? 0
  expect(derived).toBeGreaterThan(0) // Alimentation est consommée ce mois

  const res = await request.post('/api/budgets', {
    data: { categoryId: alim.id, cap: 250000, frequency: 'Mensuel', alertPct: 90, rollover: false },
  })
  expect(res.status()).toBe(201)
  const created = ((await res.json()) as { budget: BudgetRow }).budget
  expect(created.spent).toBe(derived) // reflète le consommé existant, pas 0

  // Nettoyage : archiver (pas de DELETE) → la liste active retrouve son état seedé.
  expect((await request.post(`/api/budgets/${created.id}/archive`)).status()).toBe(200)
})

test('Budgets seedés d’Aïcha : enveloppe stockée intacte (Transport 108 %)', async ({
  request,
}) => {
  const cats = (
    (await (await request.get('/api/categories')).json()) as { categories: Cat[] }
  ).categories
  const transport = cats.find((c) => c.name === 'Transport')!
  const budgets = ((await (await request.get('/api/budgets')).json()) as { budgets: BudgetRow[] })
    .budgets
  const b = budgets.find((x) => x.categoryId === transport.id)!
  expect(b.spent).toBe(54000) // enveloppe stockée (≠ dépense dérivée 116 000)
  expect(b.pct).toBe(108)
})
