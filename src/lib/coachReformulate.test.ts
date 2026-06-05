import { describe, it, expect } from 'vitest'
import { evaluateCoach, type CoachInput, type CoachVerdict } from './coach'
import { computeCompleteness, type CompletenessInput } from './coachCompleteness'
import { reformulateCoach, DETERMINISTIC_LABEL } from './coachReformulate'

function coachInput(over: Partial<CoachInput> = {}): CoachInput {
  return {
    scenario: 'survive',
    amount: 0,
    accounts: [{ balance: 1_000_000, type: 'Trésorerie', blocked: false }],
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

function complete(over: Partial<CompletenessInput> = {}): CompletenessInput {
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

const HIGH = computeCompleteness(complete()) // score 100

describe('reformulateCoach — 4 couches & niveau d’intervention par verdict', () => {
  it('ok → observation', () => {
    const r = reformulateCoach(evaluateCoach(coachInput()), HIGH)
    expect(r.layers).toHaveLength(4)
    expect(r.layers.map((l) => l.title)).toEqual([
      'Données observées',
      'Analyse calculée',
      'Niveau de confiance',
      'Recommandation',
    ])
    expect(r.interventionLevel).toBe('observation')
    expect(r.deterministicLabel).toBe(DETERMINISTIC_LABEL)
    expect(r.degraded).toBe(false)
    expect(r.reliabilityActions).toHaveLength(0)
  })

  it('ok_conditions (achat inhabituel) → recommandation', () => {
    const v = evaluateCoach(
      coachInput({
        scenario: 'afford',
        amount: 20_000,
        months: [
          { epargne: 200_000, variableSpend: 10_000 },
          { epargne: 200_000, variableSpend: 10_000 },
        ],
      }),
    )
    const r = reformulateCoach(v, HIGH)
    expect(v.verdict).toBe('ok_conditions')
    expect(r.interventionLevel).toBe('recommandation')
    expect(r.layers[3].text).toMatch(/habitudes/)
    expect(r.options.length).toBeGreaterThan(0)
  })

  it('risque (fragile) → alerte, cite le coussin', () => {
    const v = evaluateCoach(
      coachInput({ scenario: 'afford', amount: 40_000, accounts: [{ balance: 60_000, type: 'Trésorerie', blocked: false }] }), // prettier-ignore
    )
    const r = reformulateCoach(v, HIGH)
    expect(v.verdict).toBe('risque')
    expect(r.interventionLevel).toBe('alerte')
    expect(r.layers[3].text).toMatch(/coussin/)
  })

  it('deconseille → opposition (rare)', () => {
    const v = evaluateCoach(
      coachInput({ scenario: 'afford', amount: 100_000, accounts: [{ balance: 50_000, type: 'Trésorerie', blocked: false }], completeness: 90 }), // prettier-ignore
    )
    const r = reformulateCoach(v, HIGH)
    expect(v.verdict).toBe('deconseille')
    expect(r.interventionLevel).toBe('opposition')
    expect(r.layers[3].text).toMatch(/dépasse/)
  })
})

describe('reformulateCoach — incohérent : prose SPÉCIFIQUE (pas un faux « tout va bien »)', () => {
  it('avertit franchement de la contradiction et renvoie à la saisie', () => {
    const v = evaluateCoach(coachInput({ scenario: 'afford', amount: 0 }))
    const r = reformulateCoach(v, HIGH)
    expect(v.verdict).toBe('incoherent')
    expect(r.interventionLevel).toBe('observation')
    expect(r.layers[3].text).toMatch(/contradictoires/)
    expect(r.layers[3].text).toMatch(/vérifiez la saisie/)
    // Surtout PAS une observation neutre rassurante.
    expect(r.layers[3].text).not.toMatch(/confortable|Aucun arbitrage|tient dans votre marge/)
  })
})

describe('reformulateCoach — dégradation gracieuse', () => {
  it('confiance basse → couche 3 « je ne peux pas conclure solidement » + actions C2 jointes', () => {
    const sparse = computeCompleteness(
      complete({ accountsCount: 1, monthsOfHistory: 0, recurrencesTotal: 0, recurrencesKnown: 0, hasCashEnvelope: false, daysSinceCashReconcile: null, budgetsCount: 0, goalsTotal: 0, goalsWithDeadline: 0 }), // prettier-ignore
    )
    const v = evaluateCoach(coachInput({ completeness: sparse.score }))
    const r = reformulateCoach(v, sparse)
    expect(r.degraded).toBe(true)
    expect(r.layers[2].text).toMatch(/conclure solidement/)
    expect(r.reliabilityActions.length).toBeGreaterThan(0)
    expect(r.reliabilityActions).toEqual(sparse.deficits) // les actions de fiabilisation C2
  })

  it('confiance haute → couche 3 rassurante, aucune action jointe', () => {
    const r = reformulateCoach(evaluateCoach(coachInput({ completeness: 90 })), HIGH)
    expect(r.degraded).toBe(false)
    expect(r.layers[2].text).toMatch(/Données suffisantes/)
    expect(r.reliabilityActions).toHaveLength(0)
  })
})

describe('reformulateCoach — AUCUN chiffre inventé (garde Phase 12)', () => {
  /** Chiffres autorisés = |valeurs| du verdict, sans séparateur. */
  function allowed(v: CoachVerdict): Set<string> {
    const nums = [
      v.disponible,
      v.margeApres,
      v.coussin,
      v.chargesFixesMensuelles,
      ...v.points.map((p) => (typeof p.value === 'number' ? p.value : NaN)),
    ]
    const set = new Set<string>()
    for (const n of nums) if (Number.isFinite(n)) set.add(String(Math.abs(Math.round(n))))
    return set
  }
  /** Extrait les nombres de la prose (groupés U+202F/U+00A0) → suite de chiffres nue. */
  function digitsIn(text: string): string[] {
    return (text.match(/\d[\d\u00a0\u202f]*/g) ?? []).map((s) => s.replace(/\D/g, ''))
  }

  it('tout nombre des 4 couches est traçable au verdict (afford risqué, riche en chiffres)', () => {
    const v = evaluateCoach(
      coachInput({ scenario: 'afford', amount: 40_000, accounts: [{ balance: 60_000, type: 'Trésorerie', blocked: false }] }), // prettier-ignore
    )
    const r = reformulateCoach(v, HIGH)
    const ok = allowed(v)
    for (const layer of r.layers)
      for (const d of digitsIn(layer.text)) expect(ok.has(d)).toBe(true)
  })

  it('idem sur le verdict déconseillé (marge négative)', () => {
    const v = evaluateCoach(
      coachInput({ scenario: 'afford', amount: 100_000, accounts: [{ balance: 50_000, type: 'Trésorerie', blocked: false }], completeness: 90 }), // prettier-ignore
    )
    const r = reformulateCoach(v, HIGH)
    const ok = allowed(v)
    for (const layer of r.layers)
      for (const d of digitsIn(layer.text)) expect(ok.has(d)).toBe(true)
  })
})

describe('reformulateCoach — déterminisme', () => {
  it('mêmes entrées → même sortie', () => {
    const v = evaluateCoach(coachInput({ scenario: 'afford', amount: 30_000 }))
    expect(reformulateCoach(v, HIGH)).toEqual(reformulateCoach(v, HIGH))
  })
})
