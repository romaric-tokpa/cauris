import { Coach } from './Coach'

/**
 * Écran Assistant IA (Lot C4) — **Avis du coach** : question (liste fermée) → réponse
 * « 4 couches » déterministe (verdict C1 + complétude C2 + reformulation C3), branchée
 * aux vraies données (`/api/coach/context`). Remplace l'ancien chat libre (placeholder) ;
 * Prévisions / Anomalies restent en sous-onglets. SUGGESTION ONLY : aucune action financière
 * déclenchée — seules les actions de fiabilisation NAVIGUENT vers les écrans concernés.
 */
export function Assistant() {
  return <Coach />
}
