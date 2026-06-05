/**
 * Assemblage CLIENT du coach (Lot C4) — PUR. Transforme le contexte BRUT renvoyé par
 * `GET /api/coach/context` (dates brutes) en entrées des libs C1/C2, dérive les grandeurs
 * de DATE ici (jours depuis réconciliation, mois jusqu'à échéance, échéance ce mois), puis
 * enchaîne `evaluateCoach` (C1) → `computeCompleteness` (C2) → `reformulateCoach` (C3).
 *
 * `today` est un PARAMÈTRE (les tests injectent leur date) ; la prod lit `COACH_TODAY`.
 */
import { evaluateCoach, type CoachInput, type CoachVerdict } from './coach'
import { computeCompleteness, type CompletenessInput, type CompletenessResult } from './coachCompleteness' // prettier-ignore
import { reformulateCoach, type CoachReformulation } from './coachReformulate'

/**
 * DETTE LOT D : basculer sur la VRAIE date à la livraison (`new Date()`/`now()`), et
 * vérifier que les tests qui en dépendent INJECTENT leur date (param `today`) au lieu de
 * lire cette constante. Bascule = 1 ligne (voir registre des bascules Lot D).
 */
export const COACH_TODAY = '2026-06-05'

export type Scenario = 'survive' | 'afford'

export interface CoachContext {
  accounts: { balance: number; type: string; blocked: boolean }[]
  recurrences: { amount: number; nextDate: string; known: boolean }[]
  budgets: { cap: number; spent: number }[]
  goals: { target: number; current: number; targetDate: string | null }[]
  months: { month: string; epargne: number | null; depenses: number | null }[]
  cashEnvelope: { accountId: string; lastReconciledAt: string | null } | null
  /** Prêts actifs : échéance mensuelle + ancre (1ʳᵉ échéance) + durée → charges dérivées. */
  loans: { monthlyPayment: number; anchorDate: string; termMonths: number }[]
}

export interface CoachAnswer {
  verdict: CoachVerdict
  completeness: CompletenessResult
  reformulation: CoachReformulation
  cashAccountId: string | null
}

/** Index de mois absolu depuis « YYYY-MM(-..) ». */
const monthIndex = (iso: string): number => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1
/** Jours entiers entre deux dates ISO (a → b). */
const daysBetween = (a: string, b: string): number =>
  Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000)

function completenessInput(ctx: CoachContext, today: string): CompletenessInput {
  const env = ctx.cashEnvelope
  return {
    accountsCount: ctx.accounts.length,
    monthsOfHistory: ctx.months.filter((m) => m.epargne != null).length,
    recurrencesTotal: ctx.recurrences.length,
    recurrencesKnown: ctx.recurrences.filter((r) => r.known).length,
    hasCashEnvelope: env != null,
    daysSinceCashReconcile:
      env && env.lastReconciledAt ? daysBetween(env.lastReconciledAt, today) : null,
    budgetsCount: ctx.budgets.length,
    goalsTotal: ctx.goals.length,
    goalsWithDeadline: ctx.goals.filter((g) => g.targetDate != null).length,
  }
}

function coachInput(
  ctx: CoachContext,
  scenario: Scenario,
  amount: number,
  today: string,
  completenessScore: number,
): CoachInput {
  const ym = today.slice(0, 7)
  const todayIdx = monthIndex(today)
  // Échéances de prêt actives ce mois → charges (zéro double-saisie : pas de récurrence manuelle).
  const loanCharges = ctx.loans
    .filter((l) => {
      const a = monthIndex(l.anchorDate)
      return a <= todayIdx && todayIdx <= a + l.termMonths - 1
    })
    .map((l) => ({ amount: -l.monthlyPayment, dueThisMonth: true }))
  return {
    scenario,
    amount: scenario === 'afford' ? amount : 0,
    accounts: ctx.accounts,
    recurrences: [
      ...ctx.recurrences.map((r) => ({
        amount: r.amount,
        dueThisMonth: r.nextDate.slice(0, 7) === ym, // échéance dans le mois courant
      })),
      ...loanCharges,
    ],
    budgets: ctx.budgets,
    goals: ctx.goals.map((g) => ({
      target: g.target,
      current: g.current,
      monthsToDeadline: g.targetDate ? monthIndex(g.targetDate) - monthIndex(today) : null,
    })),
    months: ctx.months.map((m) => ({ epargne: m.epargne, variableSpend: Math.abs(m.depenses ?? 0) })), // prettier-ignore
    completeness: completenessScore,
  }
}

/** Chaîne complète C2 → C1 → C3. `today` injectable (tests) ; défaut = `COACH_TODAY`. */
export function computeCoachAnswer(
  ctx: CoachContext,
  scenario: Scenario,
  amount: number,
  today: string = COACH_TODAY,
): CoachAnswer {
  const completeness = computeCompleteness(completenessInput(ctx, today))
  const verdict = evaluateCoach(coachInput(ctx, scenario, amount, today, completeness.score))
  const reformulation = reformulateCoach(verdict, completeness)
  return { verdict, completeness, reformulation, cashAccountId: ctx.cashEnvelope?.accountId ?? null }
}
