import { describe, it, expect } from 'vitest'
import {
  computeCompleteness,
  COMPLETENESS_THRESHOLDS,
  type CompletenessInput,
} from './coachCompleteness'
// Branchement C2 → C1 : la confiance dérive du score via le MÊME mapping (pas de duplication).
import { confidenceOf, COACH_THRESHOLDS } from './coach'

const W = COMPLETENESS_THRESHOLDS.weights

/** Profil COMPLET (score 100). Surchargé par cas. */
function profile(over: Partial<CompletenessInput> = {}): CompletenessInput {
  return {
    accountsCount: 4,
    monthsOfHistory: 6,
    recurrencesTotal: 6,
    recurrencesKnown: 6,
    hasCashEnvelope: true,
    daysSinceCashReconcile: 2,
    budgetsCount: 3,
    goalsTotal: 2,
    goalsWithDeadline: 2,
    ...over,
  }
}

describe('COMPLETENESS_THRESHOLDS', () => {
  it('les pondérations somment à 100', () => {
    expect(Object.values(W).reduce((s, w) => s + w, 0)).toBe(100)
  })
})

describe('computeCompleteness — profils types', () => {
  it('utilisateur complet → score 100 → confiance haute', () => {
    const r = computeCompleteness(profile())
    expect(r.score).toBe(100)
    expect(r.deficits).toHaveLength(0)
    expect(confidenceOf(r.score)).toBe('high')
  })

  it('nouvel inscrit → score bas → confiance basse + déficits triés par poids (cash N/A absent)', () => {
    const r = computeCompleteness(
      profile({
        accountsCount: 1,
        monthsOfHistory: 0,
        recurrencesTotal: 0,
        recurrencesKnown: 0,
        hasCashEnvelope: false,
        daysSinceCashReconcile: null,
        budgetsCount: 0,
        goalsTotal: 0,
        goalsWithDeadline: 0,
      }),
    )
    expect(r.score).toBeLessThan(COACH_THRESHOLDS.confidenceMed)
    expect(confidenceOf(r.score)).toBe('low')
    // Cash sans enveloppe = N/A → jamais un déficit.
    expect(r.deficits.some((d) => d.key === 'cash')).toBe(false)
    // Déficits ordonnés par poids décroissant (impact d'abord).
    for (let i = 1; i < r.deficits.length; i++)
      expect(r.deficits[i - 1].weight).toBeGreaterThanOrEqual(r.deficits[i].weight)
    // Les axes de poids 20 (historique, charges fixes) viennent en tête.
    expect(r.deficits.slice(0, 2).map((d) => d.key).sort()).toEqual(['chargesFixes', 'historique'])
    // Chaque déficit porte une action concrète.
    expect(r.deficits.every((d) => d.action.length > 0)).toBe(true)
  })

  it('cash non réconcilié depuis 10 jours → le déficit « cash » apparaît avec son action', () => {
    const r = computeCompleteness(profile({ hasCashEnvelope: true, daysSinceCashReconcile: 10 }))
    const cash = r.deficits.find((d) => d.key === 'cash')
    expect(cash).toBeDefined()
    expect(cash?.action).toBe('Réconcilier le cash')
    // Seul le cash manque ici → score = 100 − poids cash.
    expect(r.score).toBe(100 - W.cash)
  })

  it('charge fixe partielle (5/6) → déficit « confirmer 1 charge fixe »', () => {
    const r = computeCompleteness(profile({ recurrencesTotal: 6, recurrencesKnown: 5 }))
    const cf = r.deficits.find((d) => d.key === 'chargesFixes')
    expect(cf?.action).toBe('Confirmer 1 charge fixe détectée')
  })
})

describe('computeCompleteness — bords des paliers 80 / 50 (palier = coach.confidenceOf)', () => {
  it('score == 80 (un axe de poids 20 manquant) → confiance haute (borne inclusive)', () => {
    const r = computeCompleteness(profile({ recurrencesTotal: 0, recurrencesKnown: 0 }))
    expect(r.score).toBe(100 - W.chargesFixes) // 80
    expect(confidenceOf(r.score)).toBe('high')
  })

  it('score juste sous 80 → confiance moyenne', () => {
    // chargesFixes 0 (−20) + budgets 2/3 (−5) → 75.
    const r = computeCompleteness(profile({ recurrencesTotal: 0, recurrencesKnown: 0, budgetsCount: 2 })) // prettier-ignore
    expect(r.score).toBe(75)
    expect(confidenceOf(r.score)).toBe('med')
  })

  it('score == 50 → confiance moyenne (borne inclusive)', () => {
    // historique 0 (−20) + chargesFixes 0 (−20) + objectifs 1/3 (−10) → 50.
    const r = computeCompleteness(
      profile({ monthsOfHistory: 0, recurrencesTotal: 0, recurrencesKnown: 0, goalsTotal: 3, goalsWithDeadline: 1 }), // prettier-ignore
    )
    expect(r.score).toBe(50)
    expect(confidenceOf(r.score)).toBe('med')
  })
})
