/**
 * Formate un nombre en montant francophone : milliers groupés par **espace fine
 * insécable** (U+202F, `\u202f`), sans décimales. Le suffixe « FCFA » est rendu
 * à part (cf. CLAUDE.md), donc non inclus ici.
 *
 * Porté à l'identique de `design/wireframe/wf-lib.jsx` (où le séparateur littéral
 * est aussi U+202F) :
 *   const money = (n) => {
 *     const s = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
 *     return (n < 0 ? "-" : "") + s;
 *   };
 */
export function money(n: number): string {
  const s = Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')
  return (n < 0 ? '-' : '') + s
}
