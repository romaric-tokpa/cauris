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

/** Instantané financier scopé `user_id` (composé par la route depuis la façade). */
export interface FinancialContext {
  month: string // YYYY-MM
  total: number // patrimoine = Σ soldes
  revenus: number | null
  depenses: number | null
  epargne: number | null
  savingsRate: number | null
  topCategories: { name: string; amount: number; pct: number; colorToken: string | null }[]
  budgets: { name: string; cap: number; spent: number; pct: number; tone: 'ok' | 'warn' | 'over' }[]
  goals: { name: string; current: number; target: number; pct: number }[]
  loans: { name: string; remaining: number; monthlyPayment: number }[]
}

/** Réponse de l'assistant : TEXTE + barres optionnelles. Aucun champ exécutable. */
export interface AiReply {
  reply: string
  bars?: AiBar[]
}

/**
 * Point d'entrée de l'assistant. **Pour brancher l'API Anthropic réelle, NE changer
 * QUE le corps de cette fonction** (clé serveur `process.env.ANTHROPIC_API_KEY`,
 * modèle Claude courant) : construire le system prompt à partir de `context` (lecture
 * seule) + envoyer `messages`, puis renvoyer `{ reply, bars? }`. La signature et le
 * type de retour restent identiques → la route et le front n'ont rien à changer.
 */
// eslint-disable-next-line @typescript-eslint/require-await -- le stub est synchrone ; le futur appel Anthropic awaitera (signature async conservée pour le swap).
export async function askClaude(params: {
  messages: ChatMessage[]
  context: FinancialContext
}): Promise<AiReply> {
  // TODO Phase 12+ : brancher l'API Anthropic ICI.
  //   import Anthropic from '@anthropic-ai/sdk'
  //   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })  // clé SERVEUR
  //   const res = await client.messages.create({ model: <Claude courant>,
  //     system: buildSystemPrompt(params.context), messages: params.messages, max_tokens: … })
  //   return { reply: textFrom(res) }
  // En attendant : stub déterministe, même contrat.
  return stubReply(params)
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
