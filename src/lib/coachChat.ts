/**
 * Routage HONNÊTE des questions du chat (Lot D) — PUR et déterministe.
 *
 * Contrainte de véracité : le chat ne SIMULE jamais la compréhension. Une question est
 * ROUTÉE vers ce qu'on sait vraiment traiter, sinon on l'admet :
 *  - `coach`   → scénario du moteur déterministe (survive / afford+montant) → verdict C3 ;
 *  - `data`    → intention de donnée simple (solde, dépenses, budget…) → stub askClaude
 *                EXISTANT, déjà ancré aux vraies données (`buildAiContext`) ;
 *  - `unknown` → AUCUN match → réponse « je ne sais pas encore » + questions évaluables.
 *
 * Regex FERMÉES (pas de parseur universel). DETTE LOT D : au vrai LLM, ce routage regex
 * devient un mapping LLM question→intention (le moteur décide toujours les chiffres).
 */
import type { Scenario } from './coachAssembly'

export type ChatRoute =
  | { kind: 'coach'; scenario: Scenario; amount: number }
  | { kind: 'data' }
  | { kind: 'unknown' }

/** Questions évaluables proposées en repli honnête (chips). */
export const EVALUABLE_QUESTIONS = [
  'Est-ce que je tiens jusqu’à la fin du mois ?',
  'Puis-je dépenser 50 000 ?',
  'Où part mon argent ce mois-ci ?',
  'Vais-je dépasser un budget ?',
] as const

const SURVIVE_RE = /\b(tenir|tiens|tiendrai)\b|fin d[eu] mois|jusqu.?[àa] la fin/i
const AFFORD_RE = /\b(d[ée]penser|d[ée]pense|acheter|offrir|m.offrir|me payer)\b/i
const DATA_RE =
  /\b(solde|patrimoine|d[ée]pens\w*|budget\w*|[ée]pargn\w*|[ée]conom\w*|objectif\w*|argent|compte\w*|combien|total|poste\w*|inhabituel\w*|revenus?)\b/i

/** Extrait le 1er montant entier (« 250 000 » → 250000). 0 si absent. */
function parseAmount(text: string): number {
  const m = text.match(/\d[\d\s\u00a0\u202f]*/)
  return m ? Number(m[0].replace(/\D/g, '')) || 0 : 0
}

export function routeChatQuestion(text: string): ChatRoute {
  // Achat chiffré → afford(X) prioritaire (l'intention « puis-je dépenser X » est nette).
  if (AFFORD_RE.test(text)) {
    const amount = parseAmount(text)
    if (amount > 0) return { kind: 'coach', scenario: 'afford', amount }
  }
  if (SURVIVE_RE.test(text)) return { kind: 'coach', scenario: 'survive', amount: 0 }
  if (DATA_RE.test(text)) return { kind: 'data' }
  return { kind: 'unknown' }
}
