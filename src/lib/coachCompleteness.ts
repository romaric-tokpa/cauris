/**
 * Score de complétude des données du coach (Lot C2) — PUR et DÉTERMINISTE (pattern C1).
 *
 * Transforme l'état des données en (1) un score 0–100 qui alimente la CONFIANCE du coach
 * (`confidenceOf` de `coach.ts` — seuils 80/50, NON redupliqués ici) et (2) une liste de
 * DÉFICITS traçables, chacun porteur de son **action de fiabilisation** (« Réconcilier le
 * cash », « Déclarer une charge fixe ») — ce qui rend la dégradation gracieuse ACTIONNABLE.
 *
 * Aucune dépendance : prend un `CompletenessInput` plain → `CompletenessResult`.
 */

/**
 * Pondérations = PERSONNALITÉ PRODUIT (somme = 100). Validées le 2026-06-05 ; ajustables
 * ici sans toucher aux règles. Les tests les importent (zéro valeur dupliquée).
 */
export const COMPLETENESS_THRESHOLDS = {
  weights: {
    comptes: 15,
    historique: 20,
    chargesFixes: 20,
    cash: 15,
    budgets: 15,
    objectifs: 15,
  },
  /** Comptes : ratio plein dès `targetAccounts` comptes. */
  targetAccounts: 2,
  /** Historique : ratio plein dès `targetMonths` mois de données. */
  targetMonths: 6,
  /** Budgets : ratio plein dès `targetBudgets` budgets définis. */
  targetBudgets: 3,
  /** Cash : réconcilié OK si ≤ `maxReconcileDays` jours. */
  maxReconcileDays: 7,
} as const

/** Libellés des 6 axes (pour la checklist de complétude C4). Doivent matcher `axes()`. */
export const COMPLETENESS_AXIS_LABELS = {
  comptes: 'Comptes renseignés',
  historique: "Profondeur d'historique",
  chargesFixes: 'Charges fixes déclarées',
  cash: 'Cash réconcilié',
  budgets: 'Budgets définis',
  objectifs: 'Objectifs avec échéance',
} as const

export interface CompletenessInput {
  accountsCount: number
  /** Nb de mois disposant de données (profondeur d'historique). */
  monthsOfHistory: number
  /** Charges fixes/récurrences détectées et confirmées. */
  recurrencesTotal: number
  recurrencesKnown: number
  /** Le compte espèces a-t-il une enveloppe (sinon l'axe cash est N/A → non pénalisant) ? */
  hasCashEnvelope: boolean
  /** Jours depuis la dernière réconciliation (null = jamais). Ignoré si pas d'enveloppe. */
  daysSinceCashReconcile: number | null
  budgetsCount: number
  goalsTotal: number
  goalsWithDeadline: number
}

export interface CompletenessDeficit {
  key: 'comptes' | 'historique' | 'chargesFixes' | 'cash' | 'budgets' | 'objectifs'
  /** Axe concerné (libellé court). */
  label: string
  /** Action de fiabilisation concrète (proposée à l'utilisateur). */
  action: string
  /** Poids de l'axe — sert au tri des déficits (impact décroissant). */
  weight: number
}

export interface CompletenessResult {
  /** 0–100. À passer à `confidenceOf` (coach.ts) pour dériver la confiance. */
  score: number
  /** Déficits ordonnés par poids décroissant (le plus impactant d'abord). */
  deficits: CompletenessDeficit[]
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

/** Évalue un axe : ratio [0,1] + (si < 1) le déficit actionnable correspondant. */
interface Axis {
  key: CompletenessDeficit['key']
  label: string
  weight: number
  ratio: number
  action: string // action de fiabilisation si ratio < 1
}

function axes(input: CompletenessInput): Axis[] {
  const W = COMPLETENESS_THRESHOLDS.weights
  const T = COMPLETENESS_THRESHOLDS

  // Charges fixes : si rien de détecté → axe vide (0) ; sinon part confirmée.
  const chargesRatio = input.recurrencesTotal === 0 ? 0 : input.recurrencesKnown / input.recurrencesTotal // prettier-ignore
  const chargesManquantes = input.recurrencesTotal - input.recurrencesKnown
  const chargesAction =
    input.recurrencesTotal === 0
      ? 'Déclarer vos charges fixes'
      : `Confirmer ${chargesManquantes} charge${chargesManquantes > 1 ? 's' : ''} fixe${chargesManquantes > 1 ? 's' : ''} détectée${chargesManquantes > 1 ? 's' : ''}` // prettier-ignore

  // Cash : N/A (ratio 1, non pénalisant) si pas d'enveloppe ; sinon réconcilié récent ?
  const cashRatio = !input.hasCashEnvelope
    ? 1
    : (input.daysSinceCashReconcile ?? Infinity) <= T.maxReconcileDays
      ? 1
      : 0

  // Objectifs : aucun → axe vide ; sinon part avec échéance.
  const objRatio = input.goalsTotal === 0 ? 0 : input.goalsWithDeadline / input.goalsTotal
  const objAction =
    input.goalsTotal === 0 ? 'Définir un objectif' : 'Ajouter une échéance à un objectif'

  return [
    { key: 'comptes', label: 'Comptes renseignés', weight: W.comptes, ratio: clamp01(input.accountsCount / T.targetAccounts), action: 'Ajouter un compte' }, // prettier-ignore
    { key: 'historique', label: "Profondeur d'historique", weight: W.historique, ratio: clamp01(input.monthsOfHistory / T.targetMonths), action: 'Continuer le suivi régulier' }, // prettier-ignore
    { key: 'chargesFixes', label: 'Charges fixes déclarées', weight: W.chargesFixes, ratio: clamp01(chargesRatio), action: chargesAction }, // prettier-ignore
    { key: 'cash', label: 'Cash réconcilié', weight: W.cash, ratio: cashRatio, action: 'Réconcilier le cash' }, // prettier-ignore
    { key: 'budgets', label: 'Budgets définis', weight: W.budgets, ratio: clamp01(input.budgetsCount / T.targetBudgets), action: 'Définir un budget' }, // prettier-ignore
    { key: 'objectifs', label: 'Objectifs avec échéance', weight: W.objectifs, ratio: clamp01(objRatio), action: objAction }, // prettier-ignore
  ]
}

/** Calcule le score (Σ ratio·poids) + les déficits actionnables (ratio < 1), triés par poids. */
export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const list = axes(input)
  const score = Math.round(list.reduce((s, a) => s + a.ratio * a.weight, 0))
  const deficits = list
    .filter((a) => a.ratio < 1)
    .map((a) => ({ key: a.key, label: a.label, action: a.action, weight: a.weight }))
    .sort((a, b) => b.weight - a.weight) // tri stable : poids décroissant, ordre d'axe à égalité
  return { score, deficits }
}
