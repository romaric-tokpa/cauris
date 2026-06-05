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

/* ───────────── Amortissement « échéance constante tout-compris » (SGCI) ─────────────
 * Référence de vérité : tableau d'amortissement bancaire réel. L'amortissement (part de
 * capital) suit le plan de l'échéance CONSTANTE (composantes régulières 30/360) ; la 1ʳᵉ
 * période peut être PRORATISÉE (`firstPeriodDays`) — intérêts ET assurance × jours/360 —
 * d'où une 1ʳᵉ échéance plus faible. Dernière échéance : solde le capital à 0.
 * Entièrement testé au franc près contre les lignes du PDF (cf. loanSim.test.ts). */

export interface AllInclusiveInput {
  principal: number
  /** Échéance constante régulière (chiffre banque, tout-compris). */
  payment: number
  rateBps: number // taux nominal annuel en bps (750 = 7,5 %)
  taxBps: number // taxe sur intérêts en bps (1000 = 10 %)
  insuranceBps: number // assurance annuelle sur capital restant en bps (110 = 1,1 %)
  term: number // nombre d'échéances
  /** Jours de la 1ʳᵉ période (proration intérêts+assurance) ; 30 = pas de prorata. */
  firstPeriodDays: number
  /** Frais de dossier à la mise en place → ligne 0. */
  fees?: number
}

export interface AmortLine {
  n: number // 0 = frais de dossier ; 1..term = échéances
  interest: number
  tax: number
  insurance: number
  principal: number // amortissement (part de capital)
  payment: number // montant total de l'échéance
  remainingAfter: number
}

export interface AmortResult {
  lines: AmortLine[]
  totals: { principal: number; interest: number; tax: number; insurance: number; payments: number }
}

/** Arrondi au franc, demi vers le BAS (convention du tableau bancaire : 27 187,5 → 27 187). */
const roundHalfDown = (x: number): number => -Math.round(-x)

/** Résidu d'arrondi cumulé max absorbé sur l'intérêt de la dernière échéance pleine (franc). */
const LOAN_ROUNDING_ABSORB = 50

/** Intérêt d'une période : capital × taux annuel × jours/360 (30/360 si jours = 30). */
function periodInterest(capital: number, rateBps: number, days: number): number {
  return roundHalfDown((capital * rateBps * days) / (10000 * 360))
}
/** Assurance d'une période : capital × taux annuel × jours/360. */
function periodInsurance(capital: number, insuranceBps: number, days: number): number {
  return roundHalfDown((capital * insuranceBps * days) / (10000 * 360))
}

/**
 * Génère l'échéancier tout-compris. `payment` = échéance constante régulière ; la part de
 * capital de CHAQUE ligne dérive de cette échéance régulière (composantes 30/360), tandis
 * que les composantes AFFICHÉES de la 1ʳᵉ ligne sont proratisées (`firstPeriodDays`).
 */
export function amortizeAllInclusive(input: AllInclusiveInput): AmortResult {
  const { principal, payment, rateBps, taxBps, insuranceBps, term, firstPeriodDays, fees = 0 } = input
  const lines: AmortLine[] = []
  if (fees > 0)
    lines.push({ n: 0, interest: 0, tax: 0, insurance: 0, principal: 0, payment: fees, remainingAfter: principal }) // prettier-ignore

  let cap = principal
  for (let n = 1; n <= term; n++) {
    // Composantes AFFICHÉES : proratisées sur la 1ʳᵉ période, régulières ensuite.
    const days = n === 1 ? firstPeriodDays : 30
    let interest = periodInterest(cap, rateBps, days)
    const insurance = periodInsurance(cap, insuranceBps, days)
    const tax = Math.round((interest * taxBps) / 10000)

    // Amortissement piloté par l'échéance CONSTANTE (composantes régulières 30/360).
    const intReg = periodInterest(cap, rateBps, 30)
    const taxReg = Math.round((intReg * taxBps) / 10000)
    const insReg = periodInsurance(cap, insuranceBps, 30)
    let amort = payment - intReg - taxReg - insReg

    if (n === term || amort >= cap) {
      amort = cap // dernière échéance : capital soldé à 0
      // Le résidu d'arrondi cumulé (≤ tolérance) est ABSORBÉ sur l'intérêt final : l'échéance
      // reste la constante banque (convention du tableau réel). Au-delà = vraie échéance partielle.
      const residual = payment - (amort + interest + tax + insurance)
      if (residual > 0 && residual <= LOAN_ROUNDING_ABSORB) interest += residual
    }

    cap -= amort
    lines.push({ n, interest, tax, insurance, principal: amort, payment: amort + interest + tax + insurance, remainingAfter: cap }) // prettier-ignore
  }

  const sum = (pick: (l: AmortLine) => number) => lines.reduce((s, l) => s + pick(l), 0)
  return {
    lines,
    totals: {
      principal: sum((l) => l.principal),
      interest: sum((l) => l.interest),
      tax: sum((l) => l.tax),
      insurance: sum((l) => l.insurance),
      payments: sum((l) => l.payment),
    },
  }
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
