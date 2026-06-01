/**
 * Formatage de dates francophone abrégé (cf. CLAUDE.md) : `28 mai`, `15 juin 2026`,
 * `Auj.`, `Hier`. Le wireframe n'a pas de helper (dates en dur) → on pose le standard.
 *
 * Règles :
 * - rendu relatif `Auj.` / `Hier` par rapport à `reference` (désactivable) ;
 * - l'année n'apparaît que si elle diffère de l'année de référence, ou si `withYear`.
 */

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const

export interface FormatDateOptions {
  /** Date de référence pour `Auj.`/`Hier` et l'année (défaut : maintenant). */
  reference?: Date
  /** Force l'affichage de l'année même si elle est identique à la référence. */
  withYear?: boolean
  /** Désactive le rendu relatif `Auj.`/`Hier`. */
  relative?: boolean
}

const DAY_MS = 86_400_000

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function formatDateFR(
  input: Date | string | number,
  options: FormatDateOptions = {},
): string {
  const date = input instanceof Date ? input : new Date(input)
  const reference = options.reference ?? new Date()
  const relative = options.relative ?? true

  if (relative) {
    const diffDays = Math.round((startOfDay(date) - startOfDay(reference)) / DAY_MS)
    if (diffDays === 0) return 'Auj.'
    if (diffDays === -1) return 'Hier'
  }

  const day = date.getDate()
  const month = MONTHS_FR[date.getMonth()]
  const showYear = options.withYear === true || date.getFullYear() !== reference.getFullYear()
  return showYear ? `${day} ${month} ${date.getFullYear()}` : `${day} ${month}`
}

/* ── Helpers ISO (parse direct des composantes : sans fuseau ni « now », donc
   déterministes — adaptés aux dates serveur `YYYY-MM-DD` / `YYYY-MM`). ── */

const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
] // prettier-ignore

// Libellés courts d'axe de graphe (3 lettres, 1:1 du wireframe : Déc/Jan/Fév…).
const MONTHS_FR_CHART = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'] // prettier-ignore

/** `2026-05-31` → `31 mai` (jour sans zéro, mois abrégé, pas d'année). */
export function formatIsoDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_FR_SHORT[m - 1] ?? ''}`.trim()
}

/** `2026-05` → `Mai` (libellé court d'axe, 1:1 du wireframe). */
export function formatIsoMonthLabel(iso: string): string {
  const m = Number(iso.split('-')[1])
  return MONTHS_FR_CHART[m - 1] ?? iso
}

/** `2026-05` → `avril` (mois précédent, minuscule, pour « vs avril »). */
export function prevMonthLong(iso: string): string {
  const m = Number(iso.split('-')[1])
  return MONTHS_FR[(m - 2 + 12) % 12]
}
