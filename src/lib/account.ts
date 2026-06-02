import { money } from './money'

/**
 * Solde affiché d'un compte. Un compte BLOQUÉ rend « ••• ••• » (CLAUDE.md) à partir
 * du flag `blocked` — le vrai solde n'arrive jamais du serveur (`balance: null`), ce
 * n'est donc pas un masquage cosmétique. Espace fine insécable (U+202F) entre les groupes.
 */
// Puces U+2022 + espace fine insécable U+202F (escapes : no-irregular-whitespace).
const MASKED = '••• •••'

export function maskedBalance(balance: number | null, blocked: boolean): string {
  return blocked ? MASKED : money(balance ?? 0)
}
