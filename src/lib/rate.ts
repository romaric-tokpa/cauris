/**
 * Taux d'intérêt stockés en **points de base** (entier, jamais de float) : 950 = 9,5 %.
 * `rateLabel` rend la part décimale en virgule francophone, à coupler au suffixe « % »
 * (les chiffres en police mono côté composant, cf. CLAUDE.md). Ex. : `950 → "9,5"`.
 */
export function rateLabel(bps: number): string {
  return String(bps / 100).replace('.', ',')
}
