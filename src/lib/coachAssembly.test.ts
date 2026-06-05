import { describe, it, expect } from 'vitest'
import { computeCoachAnswer, type CoachContext } from './coachAssembly'

/** Contexte « à la Aïcha » : enveloppe réconciliée le 24/05, lacunes → confiance non-haute. */
function context(over: Partial<CoachContext> = {}): CoachContext {
  return {
    accounts: [
      { balance: 1_120_000, type: 'Trésorerie', blocked: false },
      { balance: 980_000, type: 'Épargne', blocked: false },
      { balance: 245_000, type: 'Mobile money', blocked: false },
      { balance: 135_000, type: 'Mobile money', blocked: true },
      { balance: 38_000, type: 'Espèces', blocked: false },
    ],
    recurrences: [
      { amount: -135_000, nextDate: '2026-06-01', known: true },
      { amount: -15_000, nextDate: '2026-06-25', known: false },
    ],
    budgets: [{ cap: 50_000, spent: 54_000 }],
    goals: [{ target: 500_000, current: 200_000, targetDate: '2026-12-31' }],
    months: [
      { month: '2026-03', epargne: 180_000, depenses: -600_000 },
      { month: '2026-04', epargne: 200_000, depenses: -620_000 },
    ],
    cashEnvelope: { accountId: 'acc-especes', lastReconciledAt: '2026-05-24' },
    ...over,
  }
}

describe('computeCoachAnswer — dérivation des dates & enchaînement', () => {
  it('cash réconcilié le 24/05, today 05/06 → ~12 j > 7 → déficit cash + confiance non-haute', () => {
    const a = computeCoachAnswer(context(), 'survive', 0, '2026-06-05')
    expect(a.reformulation.confidence).not.toBe('high')
    expect(a.reformulation.degraded).toBe(true)
    expect(a.completeness.deficits.some((d) => d.key === 'cash')).toBe(true)
    expect(a.cashAccountId).toBe('acc-especes')
    // Les actions de fiabilisation sont jointes (dégradé).
    expect(a.reformulation.reliabilityActions.length).toBeGreaterThan(0)
  })

  it('today injecté plus tôt (27/05) → cash réconcilié il y a 3 j ≤ 7 → pas de déficit cash', () => {
    const a = computeCoachAnswer(context(), 'survive', 0, '2026-05-27')
    expect(a.completeness.deficits.some((d) => d.key === 'cash')).toBe(false)
  })

  it('afford : même disponible, marge après = disponible − montant', () => {
    const survive = computeCoachAnswer(context(), 'survive', 0, '2026-06-05')
    const afford = computeCoachAnswer(context(), 'afford', 250_000, '2026-06-05')
    expect(afford.verdict.disponible).toBe(survive.verdict.disponible)
    expect(afford.verdict.margeApres).toBe(afford.verdict.disponible - 250_000)
  })
})
