/**
 * Simulateur de remboursement de prêt — calcul financier DÉTERMINISTE (≠ prévision IA).
 *
 * Toute la math est ENTIÈRE (FCFA), reproduisant l'amortissement réel mois par mois :
 * `intérêt = round(solde · i)`, `capital = mensualité − intérêt`, dernière échéance
 * partielle (le capital est soldé exactement à 0). Fonctions pures, sans dépendance →
 * testables au FCFA près (cf. `loanSim.test.ts`). Le seed garantit la cohérence du prêt
 * (la mensualité dérive de la formule d'amortissement), donc `scheduleStats` retrouve
 * exactement `monthsRemaining` pour le scénario de base.
 */

/** Taux mensuel à partir des points de base annuels : 950 bps = 9,5 %/an ÷ 12. */
export function monthlyRate(rateBps: number): number {
  return rateBps / 120000
}

export interface ScheduleStats {
  /** Nombre d'échéances jusqu'au solde nul (la dernière peut être partielle). */
  months: number
  /** Total déboursé sur l'échéancier (capital + intérêts), en FCFA. */
  totalPaid: number
  /** Total des intérêts payés, en FCFA. */
  totalInterest: number
}

/**
 * Simule l'amortissement d'un `balance` à mensualité `monthly` et taux mensuel `i`.
 * Renvoie `null` si la mensualité ne couvre pas le premier intérêt (prêt non
 * amortissable → l'UI affiche un garde-fou). Borne de boucle dure (anti-boucle infinie).
 */
export function scheduleStats(balance: number, monthly: number, i: number): ScheduleStats | null {
  if (balance <= 0) return { months: 0, totalPaid: 0, totalInterest: 0 }
  if (monthly <= Math.round(balance * i)) return null // mensualité insuffisante
  let bal = balance
  let months = 0
  let totalPaid = 0
  let totalInterest = 0
  while (bal > 0 && months < 1000) {
    const interest = Math.round(bal * i)
    let principal = monthly - interest
    if (principal >= bal) {
      // dernière échéance : partielle, solde le capital
      principal = bal
      totalPaid += principal + interest
      totalInterest += interest
      bal = 0
    } else {
      bal -= principal
      totalPaid += monthly
      totalInterest += interest
    }
    months++
  }
  return { months, totalPaid, totalInterest }
}

/** Mensualité pour solder `balance` en `n` mois au taux mensuel `i` (formule standard, arrondie au sup.). */
export function paymentFor(balance: number, n: number, i: number): number {
  if (n <= 0) return balance
  return Math.ceil((balance * i) / (1 - Math.pow(1 + i, -n)))
}

export type SimType = 'anticipe' | 'mensualite'
export type Keep = 'duree' | 'mensualite'

export interface SimInput {
  remaining: number
  rateBps: number
  monthlyPayment: number
  type: SimType
  /** Remboursement anticipé (type `anticipe`). */
  lumpSum?: number
  /** Ce qu'on conserve après le remboursement anticipé (type `anticipe`). */
  keep?: Keep
  /** Nouvelle mensualité (type `mensualite`). */
  newMonthly?: number
}

export interface SimResult {
  before: ScheduleStats
  after: ScheduleStats
  /** Mois économisés (≥ 0). */
  monthsSaved: number
  /** Intérêts économisés en FCFA (≥ 0). */
  interestSaved: number
  /** Coût total restant économisé en FCFA (le coût APRÈS inclut le remboursement anticipé). */
  costSaved: number
  /** Mensualité après scénario (recalculée en `anticipe`+`keep:duree`, sinon la nouvelle/inchangée). */
  newMonthly: number
  /** Coût total restant AVANT / APRÈS (capital + intérêts ; APRÈS inclut le lump). */
  costBefore: number
  costAfter: number
}

/**
 * Impact d'un scénario de remboursement. Renvoie `null` si l'entrée ne produit pas
 * d'échéancier valide (mensualité insuffisante) — l'appelant affiche un garde-fou.
 */
export function simulate(input: SimInput): SimResult | null {
  const i = monthlyRate(input.rateBps)
  const before = scheduleStats(input.remaining, input.monthlyPayment, i)
  if (!before) return null

  let after: ScheduleStats | null
  let newMonthly = input.monthlyPayment
  let extraOutlay = 0 // versements hors échéancier (remboursement anticipé)

  if (input.type === 'anticipe') {
    const lump = Math.max(0, Math.min(input.lumpSum ?? 0, input.remaining))
    const newBalance = input.remaining - lump
    extraOutlay = lump
    if (newBalance <= 0) {
      after = { months: 0, totalPaid: 0, totalInterest: 0 }
    } else if ((input.keep ?? 'mensualite') === 'duree') {
      // conserver la durée → mensualité recalculée (plus basse)
      newMonthly = paymentFor(newBalance, before.months, i)
      after = scheduleStats(newBalance, newMonthly, i)
    } else {
      // conserver la mensualité → durée raccourcie
      after = scheduleStats(newBalance, input.monthlyPayment, i)
    }
  } else {
    // mensualité ajustée → durée raccourcie si la nouvelle mensualité est plus élevée
    newMonthly = Math.max(0, input.newMonthly ?? input.monthlyPayment)
    after = scheduleStats(input.remaining, newMonthly, i)
  }
  if (!after) return null

  const costBefore = before.totalPaid
  const costAfter = after.totalPaid + extraOutlay
  return {
    before,
    after,
    monthsSaved: Math.max(0, before.months - after.months),
    interestSaved: Math.max(0, before.totalInterest - after.totalInterest),
    costSaved: Math.max(0, costBefore - costAfter),
    newMonthly,
    costBefore,
    costAfter,
  }
}
