/**
 * Moteur de verdicts du coach (Lot C1) — DÉTERMINISTE et PUR (pattern `loanSim`).
 *
 * Aucune dépendance : prend un `CoachInput` plain (chiffres déjà calculés côté serveur)
 * → renvoie un `CoachVerdict` structuré. Le LLM (C3) ne fera que REFORMULER cette sortie
 * en langage clair ; il ne calcule ni ne décide RIEN. Liste FERMÉE de 2 scénarios
 * (`afford` / `survive`) — pas de parseur universel.
 *
 * Tout est en entiers FCFA, testable au franc près (cf. `coach.test.ts`).
 */

/**
 * Seuils = PERSONNALITÉ PRODUIT (pas des règles). Validés par l'utilisateur le 2026-06-05 ;
 * ajustables ici SANS toucher aux règles. Les tests les importent (zéro valeur dupliquée).
 */
export const COACH_THRESHOLDS = {
  /** Coussin = fraction des charges fixes mensuelles sous laquelle la marge fin de mois est FRAGILE. */
  cushionRatio: 0.5,
  /** Multiplicateur de la dépense variable moyenne (6 mois) au-delà duquel un achat est INHABITUEL. */
  unusualMultiplier: 1.5,
  /** Nb de mois d'épargne en baisse (sur la fenêtre) concluant à un SCHÉMA DÉFAVORABLE. */
  unfavorableMonths: 2,
  /** Fenêtre (deltas m/m les plus récents) examinée pour la tendance. */
  unfavorableWindow: 3,
  /** Score de complétude (C2) → niveau de confiance (bornes INCLUSIVES). */
  confidenceHigh: 80,
  confidenceMed: 50,
} as const

export type Verdict = 'ok' | 'ok_conditions' | 'risque' | 'deconseille' | 'incoherent'
export type Confidence = 'high' | 'med' | 'low'

/** Comptes dépensables (l'épargne et les comptes bloqués ne financent pas une dépense courante). */
const SPENDABLE_TYPES = new Set(['Trésorerie', 'Mobile money', 'Espèces'])

export interface CoachAccount {
  balance: number
  type: string
  blocked: boolean
}
export interface CoachRecurrence {
  /** Montant SIGNÉ : négatif = charge fixe, positif = revenu récurrent. */
  amount: number
  /** Vrai si l'échéance tombe avant la fin du mois courant (revenu/charge encore À VENIR). */
  dueThisMonth: boolean
}
export interface CoachBudget {
  cap: number
  spent: number
}
export interface CoachGoal {
  target: number
  current: number
  /** Mois restants jusqu'à l'échéance (null = pas d'échéance → non prioritaire au sens délai). */
  monthsToDeadline: number | null
}
export interface CoachMonth {
  /** Épargne du mois (null = inconnu). Ordre attendu : CHRONOLOGIQUE (ancien → récent). */
  epargne: number | null
  /** Dépense VARIABLE du mois (hors charges fixes ; null = inconnu). */
  variableSpend: number | null
}

export interface CoachInput {
  scenario: 'afford' | 'survive'
  /** Montant X de l'achat envisagé (0 pour `survive`). */
  amount: number
  accounts: CoachAccount[]
  recurrences: CoachRecurrence[]
  budgets: CoachBudget[]
  goals: CoachGoal[]
  months: CoachMonth[]
  /** Score de complétude des données 0–100 (vrai score fourni par C2). */
  completeness: number
}

export interface CoachPoint {
  label: string
  value: number | string
  /** Couche de la réponse : donnée brute observée vs grandeur calculée. */
  layer: 'observe' | 'analyse'
}

export interface CoachFlags {
  /** margeApres ≥ 0 : l'opération est payable. */
  financeable: boolean
  /** margeApres < coussin : marge fin de mois sous le coussin de sécurité. */
  fragile: boolean
  /** Financer laisse la marge sous la contribution mensuelle requise d'un objectif à échéance. */
  goalCompromised: boolean
  /** X dépasse 1,5× la dépense variable moyenne (6 mois). */
  unusual: boolean
  /** Épargne en baisse sur ≥ `unfavorableMonths` des derniers deltas m/m. */
  unfavorableTrend: boolean
}

export interface CoachVerdict {
  scenario: 'afford' | 'survive'
  verdict: Verdict
  /** Marge projetée fin de mois (avant l'achat). */
  disponible: number
  /** Marge après l'achat (= disponible − X). */
  margeApres: number
  chargesFixesMensuelles: number
  coussin: number
  points: CoachPoint[]
  options: string[]
  flags: CoachFlags
  confidence: Confidence
}

/** Complétude (0–100) → confiance. Bornes inclusives (≥). */
export function confidenceOf(completeness: number): Confidence {
  if (completeness >= COACH_THRESHOLDS.confidenceHigh) return 'high'
  if (completeness >= COACH_THRESHOLDS.confidenceMed) return 'med'
  return 'low'
}

/** Garde de sanité : entrée incohérente → verdict `incoherent` (jamais un faux conseil). */
export function isValidInput(input: CoachInput): boolean {
  if (input.scenario === 'afford' && input.amount <= 0) return false
  if (!Number.isFinite(input.completeness) || input.completeness < 0 || input.completeness > 100)
    return false
  if (input.budgets.some((b) => b.cap < 0 || b.spent < 0)) return false
  if (input.accounts.some((a) => !Number.isFinite(a.balance))) return false
  return true
}

/** Nb de deltas d'épargne NÉGATIFS sur la fenêtre la plus récente (ordre chronologique). */
export function decliningSavings(months: CoachMonth[]): number {
  const e = months.map((m) => m.epargne).filter((v): v is number => v != null)
  const deltas: boolean[] = []
  for (let i = 1; i < e.length; i++) deltas.push(e[i] < e[i - 1])
  return deltas.slice(-COACH_THRESHOLDS.unfavorableWindow).filter(Boolean).length
}

/**
 * Mapping TOTAL flags → verdict, par ordre de PRIORITÉ strict :
 *   incoherent > deconseille > risque > ok_conditions > ok.
 * Toute combinaison (validité × 5 flags × confiance) produit EXACTEMENT un verdict.
 * Posture : l'opposition (`deconseille`) exige une CONFIANCE HAUTE ; sinon on rétrograde
 * à `risque` (dégradation gracieuse — « je ne peux pas conclure solidement »).
 */
export function mapVerdict(valid: boolean, flags: CoachFlags, confidence: Confidence): Verdict {
  if (!valid) return 'incoherent'
  if (!flags.financeable) return confidence === 'high' ? 'deconseille' : 'risque'
  if (flags.fragile) return 'risque'
  if (flags.goalCompromised || flags.unusual || flags.unfavorableTrend) return 'ok_conditions'
  return 'ok'
}

function buildOptions(verdict: Verdict, scenario: 'afford' | 'survive'): string[] {
  if (verdict === 'ok') return ['Aucun arbitrage nécessaire']
  if (scenario === 'afford')
    return ['Reporter après le prochain salaire', 'Étaler sur une épargne dédiée', 'Ajuster un budget variable'] // prettier-ignore
  return ['Réduire un budget variable ce mois', 'Reporter une dépense non essentielle']
}

/** Évalue un scénario → verdict structuré. Pur, déterministe. */
export function evaluateCoach(input: CoachInput): CoachVerdict {
  const liquide = input.accounts
    .filter((a) => !a.blocked && SPENDABLE_TYPES.has(a.type))
    .reduce((s, a) => s + a.balance, 0)
  const revenusAVenir = input.recurrences
    .filter((r) => r.dueThisMonth && r.amount > 0)
    .reduce((s, r) => s + r.amount, 0)
  const chargesAVenir = input.recurrences
    .filter((r) => r.dueThisMonth && r.amount < 0)
    .reduce((s, r) => s + Math.abs(r.amount), 0)
  const budgetsRestants = input.budgets.reduce((s, b) => s + Math.max(0, b.cap - b.spent), 0)

  const disponible = liquide + revenusAVenir - chargesAVenir - budgetsRestants
  const X = input.scenario === 'afford' ? input.amount : 0
  const margeApres = disponible - X

  const chargesFixesMensuelles = input.recurrences
    .filter((r) => r.amount < 0)
    .reduce((s, r) => s + Math.abs(r.amount), 0)
  const coussin = Math.round(chargesFixesMensuelles * COACH_THRESHOLDS.cushionRatio)

  const variableSpends = input.months
    .map((m) => m.variableSpend)
    .filter((v): v is number => v != null)
  const avgVariable = variableSpends.length
    ? variableSpends.reduce((s, v) => s + v, 0) / variableSpends.length
    : 0

  // Contribution mensuelle requise par l'objectif à échéance le plus exigeant.
  const goalNeeds = input.goals
    .filter((g) => g.current < g.target && g.monthsToDeadline != null && g.monthsToDeadline > 0)
    .map((g) => Math.ceil((g.target - g.current) / (g.monthsToDeadline as number)))
  const maxGoalNeed = goalNeeds.length ? Math.max(...goalNeeds) : 0

  const flags: CoachFlags = {
    financeable: margeApres >= 0,
    fragile: margeApres < coussin, // strict : margeApres == coussin ⇒ NON fragile (coussin = plancher sûr)
    goalCompromised: maxGoalNeed > 0 && margeApres < maxGoalNeed,
    unusual: X > COACH_THRESHOLDS.unusualMultiplier * avgVariable, // strict : X == 1,5× ⇒ NON inhabituel
    unfavorableTrend: decliningSavings(input.months) >= COACH_THRESHOLDS.unfavorableMonths,
  }

  const confidence = confidenceOf(input.completeness)
  const verdict = mapVerdict(isValidInput(input), flags, confidence)

  const points: CoachPoint[] = [
    { label: 'Solde dépensable', value: liquide, layer: 'observe' },
    { label: 'Charges fixes restantes ce mois', value: chargesAVenir, layer: 'observe' },
    { label: 'Budgets encore réservés', value: budgetsRestants, layer: 'analyse' },
    { label: 'Marge projetée fin de mois', value: disponible, layer: 'analyse' },
  ]
  if (input.scenario === 'afford')
    points.push({ label: 'Marge après cet achat', value: margeApres, layer: 'analyse' })

  return {
    scenario: input.scenario,
    verdict,
    disponible,
    margeApres,
    chargesFixesMensuelles,
    coussin,
    points,
    options: buildOptions(verdict, input.scenario),
    flags,
    confidence,
  }
}
