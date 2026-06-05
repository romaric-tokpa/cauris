/**
 * Reformulation en langage clair du verdict du coach (Lot C3) — PURE et DÉTERMINISTE.
 *
 * FRONTIÈRE UNIQUE de reformulation (pattern B3) :
 *  - AUJOURD'HUI : templating déterministe CLIENT (aucune clé, mêmes entrées → même prose).
 *  - DEMAIN (Lot D) : `POST /api/coach/reformulate` → `askClaude` (clé ANTHROPIC **serveur**,
 *    jamais cliente — CLAUDE.md). Le LLM REÇOIT ce `CoachVerdict` + cette complétude et ne
 *    fait que REFORMULER : il ne recalcule ni ne décide RIEN. Ce module reste le **garant
 *    déterministe / fallback**.
 *
 * CONTRAINTE D'ÉCRITURE DES TEMPLATES (s'impose AUSSI au futur LLM) :
 *  → la prose ne contient QUE des nombres issus de `money(champs du verdict)` ou le `%` de
 *    confiance. INTERDITS : tout littéral chiffré décoratif (« ×1,18 ») ET tout MOT-NOMBRE
 *    (« trois semaines », « deux mois »). Ainsi l'extraction numérique suffit à prouver
 *    « aucun chiffre inventé » (cf. `coachReformulate.test.ts` — leçon Phase 12).
 */
import { money } from './money'
import type { CoachVerdict, Confidence, Verdict } from './coach'
import type { CompletenessResult, CompletenessDeficit } from './coachCompleteness'

/** Étiquette d'honnêteté du wireframe — centrale (le calcul est déterministe ; le LLM ne fait que reformuler). */
export const DETERMINISTIC_LABEL = 'Calcul déterministe · reformulé en langage clair'

export type InterventionLevel = 'observation' | 'alerte' | 'recommandation' | 'opposition'

/** Mapping verdict → niveau d'intervention. L'OPPOSITION reste RARE (déconseillé seul). */
const INTERVENTION: Record<Verdict, InterventionLevel> = {
  ok: 'observation',
  ok_conditions: 'recommandation',
  risque: 'alerte',
  deconseille: 'opposition',
  incoherent: 'observation',
}

export interface CoachLayer {
  n: 1 | 2 | 3 | 4
  key: 'observe' | 'analyse' | 'confiance' | 'recommandation'
  title: string
  text: string
}

export interface CoachReformulation {
  layers: CoachLayer[]
  options: string[]
  interventionLevel: InterventionLevel
  confidence: Confidence
  /** % affiché par la barre de confiance = score de complétude (C2). */
  confidencePct: number
  /** Vrai si confiance ≠ haute → la couche 3 le dit + les actions de fiabilisation sont jointes. */
  degraded: boolean
  reliabilityActions: CompletenessDeficit[]
  deterministicLabel: string
}

const fcfa = (n: number): string => `${money(n)} FCFA`

/** Couche 1 — données observées (points bruts du verdict). */
function observeLayer(v: CoachVerdict): CoachLayer {
  const obs = v.points.filter((p) => p.layer === 'observe')
  const liquide = obs[0]?.value ?? 0
  const charges = obs[1]?.value ?? 0
  return {
    n: 1,
    key: 'observe',
    title: 'Données observées',
    text: `Votre solde dépensable est de ${fcfa(Number(liquide))} ; les charges fixes encore à régler ce mois s'élèvent à ${fcfa(Number(charges))}.`,
  }
}

/** Couche 2 — analyse calculée (marge dérivée). */
function analyseLayer(v: CoachVerdict): CoachLayer {
  const base = `Après charges fixes et budgets réservés, votre marge projetée d'ici la fin du mois est d'environ ${fcfa(v.disponible)}.`
  const afford =
    v.scenario === 'afford' ? ` Cet achat la ramènerait à ${fcfa(v.margeApres)}.` : ''
  return { n: 2, key: 'analyse', title: 'Analyse calculée', text: base + afford }
}

/** Couche 3 — niveau de confiance (+ dégradation explicite si confiance ≠ haute). */
function confianceLayer(v: CoachVerdict, degraded: boolean): CoachLayer {
  const text = !degraded
    ? 'Données suffisantes pour recommander avec assurance.'
    : `Je ne peux pas conclure solidement : certaines données manquent. Voici une estimation indicative, à confiance ${v.confidence === 'med' ? 'modérée' : 'faible'} — complétez-les pour fiabiliser l'analyse.`
  return { n: 3, key: 'confiance', title: 'Niveau de confiance', text }
}

/** Couche 4 — recommandation. Prose SPÉCIFIQUE par verdict (incohérent = avertissement franc, pas un faux « tout va bien »). */
function recommandationLayer(v: CoachVerdict): CoachLayer {
  const text = ((): string => {
    switch (v.verdict) {
      case 'ok':
        return v.scenario === 'afford'
          ? 'Cet achat tient dans votre marge du mois, sans tension. Aucun arbitrage nécessaire.'
          : 'Vous tenez jusqu’à la fin du mois avec une marge confortable.'
      case 'ok_conditions': {
        const why = v.flags.goalCompromised
          ? 'cela réduit ce que vous pourriez mettre sur un objectif à échéance'
          : v.flags.unusual
            ? 'cet achat sort de vos habitudes de dépense'
            : 'votre épargne est en repli sur les derniers mois'
        return `C'est finançable, mais ${why} : possible avec un arbitrage (voir les options).`
      }
      case 'risque':
        return `C'est finançable, mais votre marge passerait sous votre coussin de sécurité (${fcfa(v.coussin)}) : situation fragile, à surveiller.`
      case 'deconseille':
        return `Cet achat dépasse votre marge du mois : il vous laisserait à ${fcfa(v.margeApres)}. Le reporter après votre prochain salaire évite de puiser dans votre épargne.`
      case 'incoherent':
        return 'Les données de cette demande semblent contradictoires (par exemple un montant nul ou négatif) — vérifiez la saisie avant que je puisse me prononcer.'
    }
  })()
  return { n: 4, key: 'recommandation', title: 'Recommandation', text }
}

/**
 * Reformule un `CoachVerdict` (+ complétude C2) en réponse « 4 couches » + gouvernance.
 * Pur : ne recalcule ni ne décide rien (consomme les grandeurs déjà calculées).
 */
export function reformulateCoach(
  verdict: CoachVerdict,
  completeness: CompletenessResult,
): CoachReformulation {
  const degraded = verdict.confidence !== 'high'
  return {
    layers: [
      observeLayer(verdict),
      analyseLayer(verdict),
      confianceLayer(verdict, degraded),
      recommandationLayer(verdict),
    ],
    options: verdict.options,
    interventionLevel: INTERVENTION[verdict.verdict],
    confidence: verdict.confidence,
    confidencePct: completeness.score,
    degraded,
    // Dégradation gracieuse : on JOINT les actions de fiabilisation C2 (« Réconcilier le cash »…).
    reliabilityActions: degraded ? completeness.deficits : [],
    deterministicLabel: DETERMINISTIC_LABEL,
  }
}
