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
// eslint-disable-next-line @typescript-eslint/require-await -- les stubs sont synchrones ; le futur appel Anthropic awaitera (signature async conservée pour le swap).
export async function askClaude(params: {
  mode?: 'chat' | 'insights'
  messages?: ChatMessage[]
  context: FinancialContext
}): Promise<AiReply | InsightsResult> {
  // TODO Phase 12+ : brancher l'API Anthropic ICI (clé SERVEUR process.env.ANTHROPIC_API_KEY,
  //   modèle Claude courant). MÊME frontière pour les deux modes : `chat` (system prompt +
  //   `messages` → texte) et `insights` (system prompt « génère N insights structurés » →
  //   JSON parsé). Seul ce corps change ; signatures et types de retour inchangés.
  if (params.mode === 'insights') return stubInsights(params.context)
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

/** Pourcentage francophone signé à une décimale (« +5,5 % »). */
function deltaPct(now: number, before: number): string {
  const d = Math.round(((now - before) / before) * 1000) / 10
  return `${d >= 0 ? '+' : '−'}${Math.abs(d).toString().replace('.', ',')} %`
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
