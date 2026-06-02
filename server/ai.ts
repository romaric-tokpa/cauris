/**
 * Couche IA — Assistant financier (Phase 12, sous-bloc 1).
 *
 * `askClaude` est la **FRONTIÈRE stub → réel** : sa signature et son type de retour
 * sont ceux d'un futur appel Messages API Anthropic. Tant que la clé n'est pas
 * branchée, le corps délègue à un STUB DÉTERMINISTE (zéro coût, zéro dépendance) qui
 * compose ses réponses à partir du **contexte financier scopé** passé par la route.
 *
 * RÈGLE NON NÉGOCIABLE (CLAUDE.md §1.6) : l'assistant ne fait que **suggérer**. Sa
 * sortie est du TEXTE (+ barres de répartition en lecture seule) — JAMAIS une action
 * exécutable. Le `FinancialContext` ne contient que des libellés et des nombres
 * (aucun id/handle), donc l'assistant ne peut rien déclencher.
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Barre de répartition (lecture seule) jointe à une réponse. `colorToken` = 'cat-N'
 *  (rendu en `var(--cat-N)` côté front, cohérent avec le donut). */
export interface AiBar {
  label: string
  amount: number
  pct: number
  colorToken: string | null
}

/**
 * Instantané financier scopé `user_id` (composé par la route depuis la façade).
 * Les `id` de budgets/objectifs servent UNIQUEMENT à construire des liens de
 * NAVIGATION (lecture seule) ; ils n'ouvrent aucune action exécutable (§1.6).
 */
export interface FinancialContext {
  month: string // YYYY-MM
  total: number // patrimoine = Σ soldes
  revenus: number | null
  depenses: number | null
  depensesPrev: number | null // dépenses du mois précédent (tendance MoM)
  epargne: number | null
  savingsRate: number | null
  topCategories: { name: string; amount: number; pct: number; colorToken: string | null }[]
  budgets: { id: string; name: string; cap: number; spent: number; pct: number; tone: 'ok' | 'warn' | 'over' }[]
  goals: { id: string; name: string; current: number; target: number; pct: number }[]
  loans: { name: string; remaining: number; monthlyPayment: number }[]
}

/** Réponse de l'assistant (chat) : TEXTE + barres optionnelles. Aucun champ exécutable. */
export interface AiReply {
  reply: string
  bars?: AiBar[]
}

/**
 * Insight du dashboard. `type` = sémantique (info/alerte/conseil) ; `tag`/`tone`/`icon`
 * = rendu (insight-tag tonifié) ; `href` = lien de NAVIGATION (lecture seule), jamais
 * une action exécutable. SUGGESTION ONLY (§1.6).
 */
export interface Insight {
  id: string
  type: 'info' | 'alerte' | 'conseil'
  tag: string
  tone: 'over' | 'warn' | 'ok' | ''
  icon: string
  text: string
  href: string | null
}

export interface InsightsResult {
  insights: Insight[]
}

/** Budget ciblé pour un conseil (composé par la route). `transactionsHref` = lien de
 *  NAVIGATION vers les opérations de la catégorie (lecture seule, jamais d'action). */
export interface BudgetTarget {
  name: string
  cap: number
  spent: number // enveloppe stockée
  pct: number
  tone: 'ok' | 'warn' | 'over'
  ecart: number // spent - cap (dépassement de l'enveloppe)
  categoryTotal: number // dépense TOTALE de la catégorie (dérivée du ledger)
  transactionsHref: string
}

/** Conseil budget : TEXTE + lien de navigation. Aucun champ exécutable (§1.6). */
export interface BudgetAdvice {
  text: string
  tone: 'ok' | 'warn' | 'over' | ''
  href: string | null
}

/** Objectif ciblé pour une projection (composé par la route depuis la façade). */
export interface GoalTarget {
  name: string
  reste: number // target - current (≥ 0)
  avg: number // moyenne des contributions (FCFA), 0 si aucune
  count: number // nombre de contributions (échantillon)
  targetDate: string | null // YYYY-MM-DD
  nowMonth: string // YYYY-MM (mois courant produit)
}

/**
 * Projection d'objectif — PRÉVISION §1.6 : TOUJOURS étiquetée estimation, avec
 * `horizon` + `confidence` + base de calcul (`text`/`basis`). Jamais une certitude.
 * `eta` = échéance estimée (libellé) ; `suggestedPace` = rythme mensuel pour tenir la
 * date cible ; `advice` = recommandation honnête. Aucun champ exécutable.
 */
export interface GoalProjection {
  eta: string | null // « avr. 2027 » | « déjà atteint » | null
  horizon: string // « à votre rythme actuel »
  confidence: 'faible' | 'moyenne' | 'élevée'
  basis: string // « la moyenne de vos 4 dernières contributions (80 000 FCFA) »
  text: string // phrase d'estimation complète (horizon + confiance + base)
  suggestedPace: number | null // FCFA/mois pour tenir la date cible
  advice: string // recommandation (banner Conseil)
}

/* ── Prévisions (onglet « Prévisions ») — ENTRÉE calculée par la route (façade). ── */
export interface ForecastTarget {
  current: number // solde actuel (Σ comptes)
  monthlyNet: number // solde net mensuel moyen (revenus − dépenses) sur l'historique
  monthsCount: number // nb de mois d'historique complets utilisés (→ confiance)
  expenseTrend: number | null // ratio dépenses M/M (1,055 = +5,5 %) ; null si indéterminé
  trendLabel: string | null // « +5,5 % » (libellé du ratio, pour la base)
  budgets: { name: string; pct: number }[] // budgets du mois (consommé %)
}
/** Solde projeté à un horizon (estimation linéaire). */
export interface ForecastPoint {
  label: string // « Solde à 7 jours »
  amount: number
  delta: number // amount − current (signé)
}
/** Risque de dépassement projeté d'UN budget (tendance des dépenses appliquée). */
export interface BudgetRisk {
  name: string
  consumedPct: number
  projectedPct: number
  risk: 'ok' | 'warn' | 'over'
}
export interface ForecastsResult {
  available: boolean // false → état vide honnête (« estimation indisponible »)
  current: number
  points: ForecastPoint[] // 7 j / 15 j / fin de mois
  series: { labels: string[]; values: number[] } // [Auj., +7 j, +15 j, fin] pour le graphe
  realizedCount: number // points « réalisés » au début de la série (1 = Auj.)
  budgetRisks: BudgetRisk[]
  horizon: string // « fin du mois en cours »
  confidence: 'faible' | 'moyenne' | 'élevée'
  basis: string // « vos N derniers mois (solde net moyen X FCFA/mois) »
  framing: string // phrase d'estimation complète (§1.6)
}

/* ── Anomalies (onglet « Anomalies ») — ENTRÉE calculée par la route (ledger réel). ── */
/** Dépense candidate à l'anomalie (écart au profil de sa catégorie). */
export interface AnomalyCandidate {
  label: string
  category: string
  amount: number // signé (négatif = dépense)
  when: string // YYYY-MM-DD
  categoryAvg: number // moyenne des AUTRES dépenses de la même catégorie (référence)
  ratio: number // |amount| / categoryAvg
  href: string // lien de NAVIGATION vers les opérations de la catégorie (jamais d'action)
}
/** Paiement récurrent détecté (type « Récurrente » du ledger). */
export interface RecurringCandidate {
  label: string
  category: string
  amount: number
}
export interface AnomalyInput {
  month: string
  candidates: AnomalyCandidate[]
  recurring: RecurringCandidate[]
}
export interface Anomaly {
  id: string
  name: string
  category: string
  amount: number
  when: string // « 6 mai » (libellé court)
  level: 'Élevé' | 'Moyen'
  reason: string // explication PAR COMPARAISON à l'historique de la catégorie (§1.6)
  href: string // « Examiner » → opérations de la catégorie (navigation, jamais d'action)
}
export interface Recurring {
  name: string
  category: string
  amount: number
}
export interface AnomaliesResult {
  anomalies: Anomaly[] // [] → état « rien à signaler » honnête (jamais d'anomalie inventée)
  recurring: Recurring[]
  summary: string // ligne de contexte (méthode de détection)
}

/**
 * Point d'entrée de l'assistant. **Pour brancher l'API Anthropic réelle, NE changer
 * QUE le corps de cette fonction** (clé serveur `process.env.ANTHROPIC_API_KEY`,
 * modèle Claude courant) : construire le system prompt à partir de `context` (lecture
 * seule) + envoyer `messages`, puis renvoyer `{ reply, bars? }`. La signature et le
 * type de retour restent identiques → la route et le front n'ont rien à changer.
 */
export async function askClaude(params: {
  mode?: 'chat'
  messages: ChatMessage[]
  context: FinancialContext
}): Promise<AiReply>
export async function askClaude(params: {
  mode: 'insights'
  context: FinancialContext
}): Promise<InsightsResult>
export async function askClaude(params: {
  mode: 'budget-advice'
  context: FinancialContext
  budget: BudgetTarget
}): Promise<BudgetAdvice>
export async function askClaude(params: {
  mode: 'goal-projection'
  context: FinancialContext
  goal: GoalTarget
}): Promise<GoalProjection>
export async function askClaude(params: {
  mode: 'forecasts'
  context: FinancialContext
  forecast: ForecastTarget
}): Promise<ForecastsResult>
export async function askClaude(params: {
  mode: 'anomalies'
  context: FinancialContext
  anomalies: AnomalyInput
}): Promise<AnomaliesResult>
// eslint-disable-next-line @typescript-eslint/require-await -- les stubs sont synchrones ; le futur appel Anthropic awaitera (signature async conservée pour le swap).
export async function askClaude(params: {
  mode?: 'chat' | 'insights' | 'budget-advice' | 'goal-projection' | 'forecasts' | 'anomalies'
  messages?: ChatMessage[]
  context: FinancialContext
  budget?: BudgetTarget
  goal?: GoalTarget
  forecast?: ForecastTarget
  anomalies?: AnomalyInput
}): Promise<
  AiReply | InsightsResult | BudgetAdvice | GoalProjection | ForecastsResult | AnomaliesResult
> {
  // TODO Phase 12+ : brancher l'API Anthropic ICI (clé SERVEUR process.env.ANTHROPIC_API_KEY,
  //   modèle Claude courant). MÊME frontière pour tous les modes : `chat` (messages → texte),
  //   `insights` / `budget-advice` / `goal-projection` / `forecasts` / `anomalies` (system prompt
  //   dédié → JSON structuré). Seul ce corps change ; signatures et types de retour inchangés.
  if (params.mode === 'insights') return stubInsights(params.context)
  if (params.mode === 'budget-advice') return stubBudgetAdvice(params.budget!)
  if (params.mode === 'goal-projection') return stubGoalProjection(params.goal!)
  if (params.mode === 'forecasts') return stubForecasts(params.forecast!)
  if (params.mode === 'anomalies') return stubAnomalies(params.anomalies!)
  return stubReply({ messages: params.messages ?? [], context: params.context })
}

/* ───────────────────────────── Stub déterministe ───────────────────────────── */

/** Format FCFA (espace fine insécable U+202F) — miroir de `src/lib/money.ts`. */
function fcfa(n: number): string {
  const s = Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] // prettier-ignore

/** « 2026-05 » → « mai ». */
function monthLabel(month: string): string {
  const m = Number(month.slice(5, 7))
  return MONTHS_FR[m - 1] ?? month
}

/** « 2026-05 » → « avril » (mois précédent). */
function prevMonthLabel(month: string): string {
  const m = Number(month.slice(5, 7))
  return MONTHS_FR[(m - 2 + 12) % 12]
}

const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
] // prettier-ignore

/** Ajoute `n` mois à « YYYY-MM » → libellé court « avr. 2027 ». */
function addMonthsLabel(baseMonth: string, n: number): string {
  const [y, m] = baseMonth.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  return `${MONTHS_FR_SHORT[((total % 12) + 12) % 12]} ${Math.floor(total / 12)}`
}

/** « YYYY-MM » → « avr. 2027 ». */
function monthYearLabel(month: string): string {
  return addMonthsLabel(month, 0)
}

/** Nombre de mois de `fromMonth` à `toMonth` (« YYYY-MM »). */
function monthsBetween(fromMonth: string, toMonth: string): number {
  const [fy, fm] = fromMonth.split('-').map(Number)
  const [ty, tm] = toMonth.split('-').map(Number)
  return ty * 12 + (tm - 1) - (fy * 12 + (fm - 1))
}

/** Pourcentage francophone signé à une décimale (« +5,5 % »). */
function deltaPct(now: number, before: number): string {
  const d = Math.round(((now - before) / before) * 1000) / 10
  return `${d >= 0 ? '+' : '−'}${Math.abs(d).toString().replace('.', ',')} %`
}

/** « 2026-05-06 » → « 6 mai » (jour + mois abrégé francophone). */
function dayMonthLabel(iso: string): string {
  const m = Number(iso.slice(5, 7))
  return `${Number(iso.slice(8, 10))} ${MONTHS_FR[m - 1] ?? ''}`.trim()
}

/** Nombre francophone à une décimale (« 4,5 ») — multiplicateur d'anomalie. */
function ratioLabel(r: number): string {
  return (Math.round(r * 10) / 10).toString().replace('.', ',')
}

/** Minuscule + sans diacritiques (matching de mots-clés robuste). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Dernier message utilisateur de l'historique (la question courante). */
function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content
  }
  return ''
}

/**
 * Réponse déterministe, composée à partir du contexte réel scopé. Routage par
 * mots-clés ; aucune source de non-déterminisme (pas de `Date.now`/aléa). Toutes
 * les réponses sont des SUGGESTIONS/analyses — jamais des actions.
 */
function stubReply({
  messages,
  context: ctx,
}: {
  messages: ChatMessage[]
  context: FinancialContext
}): AiReply {
  const q = normalize(lastUserMessage(messages))
  const mois = monthLabel(ctx.month)

  // 1) Intention d'ACTION explicite → garde-fou §1.6 (aucune exécution).
  if (/\b(vire|virement|transfere|transferer|effectue|paie|payer|regle|reglement|supprime|modifie|cree|creer)\b/.test(q)) {
    return {
      reply:
        'Je peux vous aider à y voir clair, mais je ne déclenche aucune opération moi-même. ' +
        'Pour réaliser un virement, créer ou ajuster un budget, rendez-vous dans l’écran concerné — ' +
        'vous validez chaque étape. Je reste là pour analyser et vous suggérer la meilleure piste.',
    }
  }

  // 2) Où part l'argent / dépenses → top catégories AVEC barres.
  if (/\b(depense|depenses|argent|part|poste|postes|categorie|categories|repartition)\b/.test(q)) {
    const top = ctx.topCategories.slice(0, 3)
    const bars: AiBar[] = top.map((c) => ({
      label: c.name,
      amount: c.amount,
      pct: c.pct,
      colorToken: c.colorToken,
    }))
    const liste = top.map((c) => `${c.name} (${fcfa(c.amount)} FCFA, ${c.pct} %)`).join(', ')
    return {
      reply:
        `Vos principaux postes de dépenses en ${mois} : ${liste}. ` +
        `Au total, ${fcfa(ctx.depenses ?? 0)} FCFA dépensés ce mois-ci. ` +
        `Souhaitez-vous que je détaille l’un de ces postes ?`,
      bars,
    }
  }

  // 3) Budgets → dépassements/alertes (suggestion, pas d'action).
  if (/\b(budget|budgets|plafond|depasser|depassement|limite)\b/.test(q)) {
    const flagged = ctx.budgets.filter((b) => b.tone === 'over' || b.tone === 'warn')
    if (flagged.length) {
      const liste = flagged
        .map((b) => `${b.name} (${b.pct} % — ${fcfa(b.spent)} / ${fcfa(b.cap)} FCFA)`)
        .join(', ')
      return {
        reply:
          `À surveiller ce mois-ci : ${liste}. ` +
          `Vous pouvez relever la limite ou réduire ce poste depuis l’écran Budgets — c’est vous qui décidez.`,
      }
    }
    return {
      reply: `Bonne nouvelle : tous vos budgets de ${mois} sont sous contrôle, aucun dépassement.`,
    }
  }

  // 4) Épargne / objectifs / prévision → §1.6 (horizon + confiance + données).
  if (/\b(epargne|economie|economiser|objectif|objectifs|prevision|atteindre|futur|prochain|mois-ci|sera|fin de mois|dans \d+ mois)\b/.test(q)) {
    const obj = ctx.goals[0]
    const objTxt = obj
      ? ` Votre objectif « ${obj.name} » est à ${obj.pct} % (${fcfa(obj.current)} / ${fcfa(obj.target)} FCFA).`
      : ''
    return {
      reply:
        `Prévision — à votre rythme d’épargne actuel (${fcfa(ctx.epargne ?? 0)} FCFA en ${mois}, ` +
        `soit ${ctx.savingsRate ?? 0} % de vos revenus), vous tenez le cap.${objTxt} ` +
        `Horizon : fin du mois en cours · Niveau de confiance : moyen · ` +
        `Données utilisées : votre relevé de ${mois} (revenus, dépenses, contributions). ` +
        `C’est une estimation indicative — à confirmer selon vos prochaines opérations.`,
    }
  }

  // 5) Solde / patrimoine / comptes.
  if (/\b(solde|patrimoine|compte|comptes|combien|total)\b/.test(q)) {
    return {
      reply:
        `Votre patrimoine total s’élève à ${fcfa(ctx.total)} FCFA sur l’ensemble de vos comptes. ` +
        `En ${mois}, vos revenus (${fcfa(ctx.revenus ?? 0)} FCFA) couvrent vos dépenses ` +
        `(${fcfa(ctx.depenses ?? 0)} FCFA), pour une épargne de ${fcfa(ctx.epargne ?? 0)} FCFA. ` +
        `Je peux détailler un poste ou un compte si vous le souhaitez.`,
    }
  }

  // 6) Défaut — orientation (suggestions).
  return {
    reply:
      'Je suis votre assistant financier Cauris. Je peux analyser vos dépenses, vos budgets, ' +
      'votre épargne et vos objectifs — sans jamais agir à votre place. Essayez par exemple : ' +
      '« Où part mon argent ce mois-ci ? », « Vais-je dépasser un budget ? » ou ' +
      '« Quel sera mon solde en fin de mois ? ».',
  }
}

/* ───────────────────────── Stub insights (dashboard) ──────────────────────────
 * Insights DÉRIVÉS du contexte réel scopé (mêmes chiffres que le dashboard) :
 * - alerte : le budget le plus à risque (dépassé/proche) → /budgets/:id ;
 * - info   : tendance des dépenses M/M (réelle) → /analytics ;
 * - conseil: recommandation reliée à un objectif concret (§1.6) → /objectifs/:id.
 * Aucune ANOMALIE fabriquée (pas d'historique par catégorie seedé → non dérivable,
 * donc non inventée). Aucune PRÉVISION à horizon chiffré fabriquée. Liens = navigation
 * lecture seule, jamais d'action. Déterministe (pas de Date.now/aléa). */
function stubInsights(ctx: FinancialContext): InsightsResult {
  const insights: Insight[] = []

  // 1) Budget le plus à risque (dépassé > proche). Reflète le vrai pct (ex. Transport 108 %).
  const worst = ctx.budgets
    .filter((b) => b.tone === 'over' || b.tone === 'warn')
    .sort((a, b) => b.pct - a.pct)[0]
  if (worst) {
    const over = worst.tone === 'over'
    insights.push({
      id: 'budget-risk',
      type: 'alerte',
      tag: 'Alerte',
      tone: worst.tone,
      icon: 'gauge',
      text: over
        ? `Budget ${worst.name} dépassé : ${fcfa(worst.spent)} / ${fcfa(worst.cap)} FCFA (${worst.pct} %). Réduisez ce poste ou ajustez la limite.`
        : `Budget ${worst.name} bientôt atteint : ${fcfa(worst.spent)} / ${fcfa(worst.cap)} FCFA (${worst.pct} %). Surveillez vos prochaines dépenses.`,
      href: `/budgets/${worst.id}`,
    })
  }

  // 2) Tendance des dépenses M/M (réelle, dérivée des résumés mensuels).
  if (ctx.depenses != null && ctx.depensesPrev != null && ctx.depensesPrev > 0) {
    const sens = ctx.depenses >= ctx.depensesPrev ? 'en hausse' : 'en baisse'
    insights.push({
      id: 'trend-depenses',
      type: 'info',
      tag: 'Tendance',
      tone: '',
      icon: 'trendUp',
      text: `Vos dépenses de ${monthLabel(ctx.month)} (${fcfa(ctx.depenses)} FCFA) sont ${sens} de ${deltaPct(ctx.depenses, ctx.depensesPrev)} par rapport à ${prevMonthLabel(ctx.month)} (${fcfa(ctx.depensesPrev)} FCFA).`,
      href: '/analytics',
    })
  }

  // 3) Conseil épargne relié à un objectif concret (§1.6 : recommandation = objectif).
  const goal = ctx.goals[0]
  if (ctx.epargne != null && goal) {
    insights.push({
      id: 'advice-epargne',
      type: 'conseil',
      tag: 'Conseil',
      tone: 'ok',
      icon: 'target',
      text: `Votre taux d’épargne est de ${ctx.savingsRate ?? 0} % (${fcfa(ctx.epargne)} FCFA ce mois). En le maintenant, l’objectif « ${goal.name} » (${goal.pct} %) progresse vers ${fcfa(goal.target)} FCFA.`,
      href: `/objectifs/${goal.id}`,
    })
  }

  return { insights }
}

/* ───────────────────────── Stub conseil budget (détail) ───────────────────────
 * Conseil ciblé sur UN budget, basé sur ses VRAIS chiffres (ecart/pct/cap stockés +
 * dépense catégorie dérivée). §1.6 : recommandation reliée à l'objectif concret
 * (résorber le dépassement) ; lien = navigation vers les opérations (jamais d'action).
 * Aucun chiffre inventé. Déterministe. */
function stubBudgetAdvice(b: BudgetTarget): BudgetAdvice {
  if (b.tone === 'over') {
    return {
      text:
        `Le budget ${b.name} est dépassé de ${fcfa(b.ecart)} FCFA (${b.pct} % du plafond de ${fcfa(b.cap)} FCFA). ` +
        `Vos dépenses ${b.name} totalisent ${fcfa(b.categoryTotal)} FCFA ce mois. ` +
        `Limiter ce poste les prochaines semaines ramènerait l’enveloppe sous sa limite.`,
      tone: 'over',
      href: b.transactionsHref,
    }
  }
  if (b.tone === 'warn') {
    return {
      text:
        `Le budget ${b.name} approche du plafond : ${b.pct} % (${fcfa(b.spent)} / ${fcfa(b.cap)} FCFA). ` +
        `Surveillez vos prochaines dépenses ${b.name} pour rester dans l’enveloppe.`,
      tone: 'warn',
      href: b.transactionsHref,
    }
  }
  return {
    text:
      `Le budget ${b.name} est sous contrôle : ${b.pct} % (${fcfa(b.spent)} / ${fcfa(b.cap)} FCFA). ` +
      `Continuez ainsi pour préserver votre épargne.`,
    tone: 'ok',
    href: b.transactionsHref,
  }
}

/* ───────────────────────── Stub projection objectif ──────────────────────────
 * PRÉVISION §1.6 — TOUJOURS étiquetée ESTIMATION, avec horizon + niveau de confiance
 * + base de calcul. Échéance naïve (reste ÷ moyenne des contributions) ACCEPTABLE
 * UNIQUEMENT parce qu'elle est explicitement encadrée (jamais « atteint en novembre »
 * sec). `suggestedPace` = rythme pour tenir la date cible. Aucun chiffre inventé
 * (reste/moyenne dérivés de la façade), aucun champ exécutable. Déterministe. */
function stubGoalProjection(g: GoalTarget): GoalProjection {
  const horizon = 'à votre rythme actuel'
  // Confiance ∝ taille de l'échantillon de contributions.
  const confidence: GoalProjection['confidence'] =
    g.count >= 6 ? 'élevée' : g.count >= 3 ? 'moyenne' : 'faible'
  const basis =
    g.count > 0
      ? `la moyenne de vos ${g.count} dernières contributions (${fcfa(g.avg)} FCFA)`
      : 'vos contributions récentes'

  // Objectif déjà atteint.
  if (g.reste <= 0) {
    return {
      eta: 'déjà atteint',
      horizon,
      confidence: 'élevée',
      basis,
      text: `Objectif « ${g.name} » déjà atteint — bravo.`,
      suggestedPace: null,
      advice: `L’objectif « ${g.name} » est atteint. Vous pouvez relever la cible ou ouvrir un nouvel objectif.`,
    }
  }

  // Rythme suggéré pour tenir la date cible.
  let suggestedPace: number | null = null
  let targetLabel: string | null = null
  if (g.targetDate) {
    const m = monthsBetween(g.nowMonth, g.targetDate.slice(0, 7))
    targetLabel = monthYearLabel(g.targetDate.slice(0, 7))
    if (m > 0) suggestedPace = Math.ceil(g.reste / m)
  }

  // Échéance estimée (naïve : reste ÷ moyenne), encadrée.
  if (g.avg <= 0) {
    return {
      eta: null,
      horizon,
      confidence: 'faible',
      basis,
      text: 'Estimation indisponible : ajoutez des contributions pour projeter une échéance réaliste.',
      suggestedPace,
      advice:
        suggestedPace != null
          ? `Pour atteindre « ${g.name} » d’ici ${targetLabel}, visez environ ${fcfa(suggestedPace)} FCFA/mois.`
          : `Ajoutez des contributions régulières à « ${g.name} » : j’estimerai alors une échéance.`,
    }
  }

  const months = Math.ceil(g.reste / g.avg)
  const eta = addMonthsLabel(g.nowMonth, months)
  const text = `Estimation ${horizon} — confiance ${confidence}, basée sur ${basis}. À confirmer selon vos prochains versements.`
  const advice =
    suggestedPace != null
      ? `À votre rythme actuel (≈ ${fcfa(g.avg)} FCFA/mois), « ${g.name} » serait atteint vers ${eta}. Pour tenir votre date cible (${targetLabel}), visez plutôt ${fcfa(suggestedPace)} FCFA/mois.`
      : `À votre rythme actuel (≈ ${fcfa(g.avg)} FCFA/mois), « ${g.name} » serait atteint vers ${eta}. Augmenter vos versements rapprocherait l’échéance.`

  return { eta, horizon, confidence, basis, text, suggestedPace, advice }
}

/* ───────────────────────── Stub prévisions (onglet Prévisions) ─────────────────
 * PRÉVISION §1.6 — chaque montant projeté est une ESTIMATION encadrée : horizon +
 * confiance (∝ profondeur d'historique) + base (solde net mensuel moyen, dérivé de
 * la façade). Projection LINÉAIRE assumée (accumulation du net au prorata des jours) —
 * jamais présentée comme une certitude. Risque budget = pct consommé × tendance RÉELLE
 * des dépenses M/M (pas de multiplicateur arbitraire). Aucun chiffre inventé. État vide
 * honnête si l'historique manque. Déterministe (pas de Date.now/aléa). */
function stubForecasts(f: ForecastTarget): ForecastsResult {
  const confidence: ForecastsResult['confidence'] =
    f.monthsCount >= 6 ? 'élevée' : f.monthsCount >= 3 ? 'moyenne' : 'faible'
  const horizon = 'fin du mois en cours'
  const basis = `vos ${f.monthsCount} derniers mois (solde net moyen ${fcfa(f.monthlyNet)} FCFA/mois)`

  // Pas assez d'historique → estimation indisponible (honnête, pas de chiffre inventé).
  if (f.monthsCount === 0 || f.monthlyNet === 0) {
    return {
      available: false,
      current: f.current,
      points: [],
      series: { labels: [], values: [] },
      realizedCount: 1,
      budgetRisks: [],
      horizon,
      confidence: 'faible',
      basis,
      framing:
        'Estimation indisponible : pas assez d’historique pour projeter un solde. ' +
        'Ajoutez quelques mois d’opérations et je pourrai estimer la tendance.',
    }
  }

  // Solde projeté = solde actuel + accumulation linéaire du net (prorata 30 j).
  const at = (days: number) => f.current + Math.round((f.monthlyNet * days) / 30)
  const j7 = at(7)
  const j15 = at(15)
  const fin = at(30)
  const points: ForecastPoint[] = [
    { label: 'Solde à 7 jours', amount: j7, delta: j7 - f.current },
    { label: 'Solde à 15 jours', amount: j15, delta: j15 - f.current },
    { label: 'Solde fin de mois', amount: fin, delta: fin - f.current },
  ]
  const series = {
    labels: ['Auj.', '+7 j', '+15 j', 'Fin de mois'],
    values: [f.current, j7, j15, fin],
  }

  // Risque budget = consommé × tendance RÉELLE des dépenses (sinon constant à habitudes égales).
  const budgetRisks: BudgetRisk[] = f.budgets
    .map((b) => {
      const projectedPct = Math.round(b.pct * (f.expenseTrend ?? 1))
      const risk: BudgetRisk['risk'] =
        projectedPct >= 100 ? 'over' : projectedPct >= 90 ? 'warn' : 'ok'
      return { name: b.name, consumedPct: b.pct, projectedPct, risk }
    })
    .sort((a, b) => b.projectedPct - a.projectedPct)
    .slice(0, 5)

  const trendNote =
    f.trendLabel != null
      ? ` Risque budget projeté à partir de la tendance de vos dépenses (${f.trendLabel} sur un mois).`
      : ''
  const framing =
    `Projection linéaire à partir de votre solde net mensuel moyen — confiance ${confidence}, ` +
    `basée sur ${basis}.${trendNote} Les flux ponctuels (salaire, loyer, échéances) peuvent ` +
    `décaler ces montants : à lire comme une estimation, pas une certitude.`

  return {
    available: true,
    current: f.current,
    points,
    series,
    realizedCount: 1,
    budgetRisks,
    horizon,
    confidence,
    basis,
    framing,
  }
}

/* ───────────────────────── Stub anomalies (onglet Anomalies) ───────────────────
 * §1.6 — chaque anomalie est EXPLIQUÉE par comparaison à l'historique de SA catégorie
 * (référence = moyenne des autres dépenses de la catégorie), jamais une alerte sèche.
 * SEULEMENT les écarts réellement dérivables (candidats filtrés par la route sur le
 * ledger réel) ; si aucun → liste vide → l'écran affiche « rien à signaler » (jamais
 * d'anomalie inventée). Récurrences = paiements marqués « Récurrente » dans le ledger
 * (fait stocké, pas une inférence). Aucun champ exécutable. Déterministe. */
function stubAnomalies(a: AnomalyInput): AnomaliesResult {
  const anomalies: Anomaly[] = a.candidates
    .slice()
    .sort((x, y) => y.ratio - x.ratio)
    .map((c, i) => ({
      id: `anomaly-${i}`,
      name: c.label,
      category: c.category,
      amount: c.amount,
      when: dayMonthLabel(c.when),
      level: c.ratio >= 4 ? 'Élevé' : 'Moyen',
      reason:
        `Montant ${ratioLabel(c.ratio)}× supérieur à vos dépenses ${c.category} habituelles ` +
        `(≈ ${fcfa(c.categoryAvg)} FCFA). À vérifier si cette opération est attendue.`,
      href: c.href,
    }))

  const recurring: Recurring[] = a.recurring.map((r) => ({
    name: r.label,
    category: r.category,
    amount: r.amount,
  }))

  const summary = anomalies.length
    ? `${anomalies.length} dépense${anomalies.length > 1 ? 's' : ''} inhabituelle${anomalies.length > 1 ? 's' : ''} en ${monthLabel(a.month)}, repérée${anomalies.length > 1 ? 's' : ''} par comparaison à vos habitudes par catégorie.`
    : `Rien à signaler en ${monthLabel(a.month)} : aucune dépense ne s’écarte nettement de vos habitudes par catégorie.`

  return { anomalies, recurring, summary }
}
