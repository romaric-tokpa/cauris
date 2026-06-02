import { describe, it, expect } from 'vitest'
import { monthlyRate, scheduleStats, paymentFor, simulate } from './loanSim'

/**
 * Le prêt seedé (server/db/seed.ts) est COHÉRENT : la mensualité dérive de la formule
 * d'amortissement, donc le moteur retrouve exactement `monthsRemaining` (22) pour le
 * scénario de base. Valeurs ci-dessous calculées au FCFA près par le même modèle entier.
 */
const SEED = { remaining: 3200000, rateBps: 950, monthlyPayment: 159063 }

describe('monthlyRate()', () => {
  it('convertit les bps annuels en taux mensuel', () => {
    expect(monthlyRate(12000)).toBe(0.1) // 12000 bps = 120 %/an ÷ 12 = 10 %/mois
    expect(monthlyRate(950)).toBeCloseTo(0.00791667, 8) // 9,5 %/an ÷ 12
  })
})

describe('scheduleStats() — amortissement entier exact', () => {
  it('solde un petit prêt calculable à la main (1000 @ 10 %/mois, 400/mois)', () => {
    // m1 int100 cap300 →700 · m2 int70 cap330 →370 · m3 int37 cap363 →7 · m4 partielle int1 cap7 →0
    expect(scheduleStats(1000, 400, 0.1)).toEqual({ months: 4, totalPaid: 1208, totalInterest: 208 })
  })

  it('renvoie null si la mensualité ne couvre pas le 1er intérêt', () => {
    expect(scheduleStats(1000, 100, 0.1)).toBeNull() // intérêt = 100, mensualité = 100 → jamais soldé
  })

  it('gère un solde nul', () => {
    expect(scheduleStats(0, 400, 0.1)).toEqual({ months: 0, totalPaid: 0, totalInterest: 0 })
  })

  it('retrouve exactement la durée du prêt seedé cohérent (22 mois)', () => {
    const i = monthlyRate(SEED.rateBps)
    expect(scheduleStats(SEED.remaining, SEED.monthlyPayment, i)).toEqual({
      months: 22,
      totalPaid: 3499368,
      totalInterest: 299368,
    })
  })
})

describe('paymentFor() — mensualité pour solder en n mois', () => {
  it('calcule la mensualité (arrondie au FCFA supérieur)', () => {
    expect(paymentFor(1000, 4, 0.1)).toBe(316)
  })
  it('un prêt soldé avec cette mensualité tient bien dans n mois', () => {
    expect(scheduleStats(1000, paymentFor(1000, 4, 0.1), 0.1)?.months).toBe(4)
  })
})

describe('simulate() — scénarios déterministes sur le prêt seedé', () => {
  it('remboursement anticipé · conserver la mensualité → durée raccourcie', () => {
    const r = simulate({ ...SEED, type: 'anticipe', lumpSum: 500000, keep: 'mensualite' })
    expect(r).not.toBeNull()
    expect(r!.before.months).toBe(22)
    expect(r!.after.months).toBe(19)
    expect(r!.monthsSaved).toBe(3)
    expect(r!.interestSaved).toBe(88270)
    expect(r!.newMonthly).toBe(SEED.monthlyPayment) // mensualité inchangée
  })

  it('remboursement anticipé · conserver la durée → mensualité baissée', () => {
    const r = simulate({ ...SEED, type: 'anticipe', lumpSum: 500000, keep: 'duree' })
    expect(r).not.toBeNull()
    expect(r!.after.months).toBe(22) // durée conservée
    expect(r!.monthsSaved).toBe(0)
    expect(r!.newMonthly).toBe(134209)
    expect(r!.newMonthly).toBeLessThan(SEED.monthlyPayment)
    expect(r!.interestSaved).toBe(46775)
  })

  it('mensualité ajustée (à la hausse) → durée raccourcie', () => {
    const r = simulate({ ...SEED, type: 'mensualite', newMonthly: 200000 })
    expect(r).not.toBeNull()
    expect(r!.after.months).toBe(18)
    expect(r!.monthsSaved).toBe(4)
    expect(r!.interestSaved).toBe(64137)
    expect(r!.newMonthly).toBe(200000)
  })

  it('renvoie null si le prêt de base n’est pas amortissable', () => {
    expect(simulate({ remaining: 3200000, rateBps: 950, monthlyPayment: 10000, type: 'anticipe' })).toBeNull()
  })
})
