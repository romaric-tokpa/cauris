import { describe, it, expect } from 'vitest'
import {
  evaluateCoach,
  mapVerdict,
  confidenceOf,
  COACH_THRESHOLDS,
  type CoachInput,
  type CoachFlags,
  type Confidence,
  type Verdict,
} from './coach'

const T = COACH_THRESHOLDS

/** Entrée de base (verdict `ok` : large marge, aucun flag, confiance haute). Surchargée par cas. */
function input(over: Partial<CoachInput> = {}): CoachInput {
  return {
    scenario: 'survive',
    amount: 0,
    accounts: [{ balance: 1_000_000, type: 'Trésorerie', blocked: false }],
    // charge fixe 100 000 (⇒ coussin = 50 000), PAS à échoir ce mois.
    recurrences: [{ amount: -100_000, dueThisMonth: false }],
    budgets: [],
    goals: [],
    months: [
      { epargne: 200_000, variableSpend: 100_000 },
      { epargne: 200_000, variableSpend: 100_000 },
    ],
    completeness: 90,
    ...over,
  }
}

describe('evaluateCoach — calcul de marge', () => {
  it('disponible = liquide (hors épargne/bloqué) + revenus à venir − charges à venir − budgets restants', () => {
    const r = evaluateCoach(
      input({
        accounts: [
          { balance: 500_000, type: 'Trésorerie', blocked: false },
          { balance: 980_000, type: 'Épargne', blocked: false }, // exclu (épargne)
          { balance: 135_000, type: 'Mobile money', blocked: true }, // exclu (bloqué)
        ],
        recurrences: [
          { amount: 300_000, dueThisMonth: true }, // revenu à venir
          { amount: -120_000, dueThisMonth: true }, // charge à venir
          { amount: -50_000, dueThisMonth: false }, // charge fixe mais pas à venir
        ],
        budgets: [{ cap: 80_000, spent: 30_000 }], // 50 000 réservés
      }),
    )
    expect(r.disponible).toBe(500_000 + 300_000 - 120_000 - 50_000) // 630 000
    expect(r.chargesFixesMensuelles).toBe(170_000) // 120 000 + 50 000
    expect(r.coussin).toBe(Math.round(170_000 * T.cushionRatio))
  })
})

describe('evaluateCoach — les 5 verdicts', () => {
  it('ok : marge confortable, aucun flag', () => {
    expect(evaluateCoach(input()).verdict).toBe('ok')
  })

  it('risque : financeable mais marge sous le coussin (fragile)', () => {
    const r = evaluateCoach(
      input({ scenario: 'afford', amount: 40_000, accounts: [{ balance: 60_000, type: 'Trésorerie', blocked: false }] }), // prettier-ignore
    )
    expect(r.margeApres).toBe(20_000)
    expect(r.flags.fragile).toBe(true)
    expect(r.verdict).toBe('risque')
  })

  it('deconseille : non finançable + confiance haute (opposition rare)', () => {
    const r = evaluateCoach(
      input({ scenario: 'afford', amount: 100_000, accounts: [{ balance: 50_000, type: 'Trésorerie', blocked: false }], completeness: 90 }), // prettier-ignore
    )
    expect(r.flags.financeable).toBe(false)
    expect(r.verdict).toBe('deconseille')
  })

  it('posture : non finançable mais confiance basse → rétrograde à risque (pas d’opposition)', () => {
    const r = evaluateCoach(
      input({ scenario: 'afford', amount: 100_000, accounts: [{ balance: 50_000, type: 'Trésorerie', blocked: false }], completeness: 30 }), // prettier-ignore
    )
    expect(r.flags.financeable).toBe(false)
    expect(r.confidence).toBe('low')
    expect(r.verdict).toBe('risque')
  })

  it('ok_conditions : finançable, non fragile, mais achat INHABITUEL', () => {
    const r = evaluateCoach(
      input({
        scenario: 'afford',
        amount: 20_000, // > 1,5 × 10 000
        months: [
          { epargne: 200_000, variableSpend: 10_000 },
          { epargne: 200_000, variableSpend: 10_000 },
        ],
      }),
    )
    expect(r.flags.unusual).toBe(true)
    expect(r.flags.fragile).toBe(false)
    expect(r.verdict).toBe('ok_conditions')
  })

  it('incoherent : afford avec montant ≤ 0', () => {
    expect(evaluateCoach(input({ scenario: 'afford', amount: 0 })).verdict).toBe('incoherent')
  })
})

describe('evaluateCoach — cas LIMITES (bords tranchés et documentés)', () => {
  it('margeApres == coussin → ok (le coussin est le plancher INCLUSIF du sûr, pas risqué)', () => {
    const coussin = Math.round(100_000 * T.cushionRatio) // 50 000
    const r = evaluateCoach(
      input({
        scenario: 'afford',
        amount: 100_000 - coussin, // marge après == coussin exactement
        accounts: [{ balance: 100_000, type: 'Trésorerie', blocked: false }],
      }),
    )
    expect(r.margeApres).toBe(r.coussin)
    expect(r.flags.fragile).toBe(false)
    expect(r.verdict).toBe('ok')
  })

  it('X == 1,5× moyenne → NON inhabituel (seuil strict >, le bord est « normal »)', () => {
    const avg = 20_000
    const r = evaluateCoach(
      input({
        scenario: 'afford',
        amount: T.unusualMultiplier * avg, // pile à la limite
        months: [
          { epargne: 200_000, variableSpend: avg },
          { epargne: 200_000, variableSpend: avg },
        ],
      }),
    )
    expect(r.flags.unusual).toBe(false)
    expect(r.verdict).toBe('ok')
  })
})

describe('confidenceOf — bornes inclusives (depuis les constantes)', () => {
  it('mappe le score de complétude', () => {
    expect(confidenceOf(T.confidenceHigh)).toBe('high')
    expect(confidenceOf(T.confidenceHigh - 1)).toBe('med')
    expect(confidenceOf(T.confidenceMed)).toBe('med')
    expect(confidenceOf(T.confidenceMed - 1)).toBe('low')
  })
})

describe('mapVerdict — mapping TOTAL et ordre de priorité', () => {
  const VERDICTS: Verdict[] = ['ok', 'ok_conditions', 'risque', 'deconseille', 'incoherent']
  const bools = [true, false]
  const confs: Confidence[] = ['high', 'med', 'low']

  it('toute combinaison (validité × 5 flags × confiance) → exactement un verdict, ordre respecté', () => {
    let combos = 0
    for (const valid of bools)
      for (const financeable of bools)
        for (const fragile of bools)
          for (const goalCompromised of bools)
            for (const unusual of bools)
              for (const unfavorableTrend of bools)
                for (const confidence of confs) {
                  const flags: CoachFlags = { financeable, fragile, goalCompromised, unusual, unfavorableTrend } // prettier-ignore
                  const v = mapVerdict(valid, flags, confidence)
                  expect(VERDICTS).toContain(v) // total : toujours un verdict connu
                  // priorité recalculée indépendamment : incoherent > deconseille > risque > ok_conditions > ok
                  const expected: Verdict = !valid
                    ? 'incoherent'
                    : !financeable
                      ? confidence === 'high'
                        ? 'deconseille'
                        : 'risque'
                      : fragile
                        ? 'risque'
                        : goalCompromised || unusual || unfavorableTrend
                          ? 'ok_conditions'
                          : 'ok'
                  expect(v).toBe(expected)
                  combos++
                }
    expect(combos).toBe(bools.length * 2 ** 5 * confs.length) // 192 combinaisons couvertes
  })
})
