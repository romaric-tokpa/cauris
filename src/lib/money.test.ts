import { describe, it, expect } from 'vitest'
import { money } from './money'

// Séparateurs explicites (pas de littéral invisible dans les assertions).
const NNBSP = '\u202f' // espace fine insécable — séparateur ATTENDU
const SP = '\u0020' // espace normale — séparateur INTERDIT (rendu infidèle)

describe('money()', () => {
  it('groupe les milliers avec une espace fine insécable (U+202F)', () => {
    expect(money(2480000)).toBe(`2${NNBSP}480${NNBSP}000`)
  })

  it('utilise bien le code-point U+202F et non une espace normale', () => {
    const out = money(2480000)
    // Garde-fou explicite : on vérifie le code-point, pas « un espace » quelconque.
    expect(out.charAt(1).codePointAt(0)).toBe(0x202f)
    // Et surtout : ce n'est PAS l'espace normale — un rendu naïf serait infidèle.
    expect(out).not.toBe(`2${SP}480${SP}000`)
    expect(out.includes(SP)).toBe(false)
  })

  it('préfixe les nombres négatifs', () => {
    expect(money(-6200)).toBe(`-6${NNBSP}200`)
  })

  it('rend 0 sans séparateur', () => {
    expect(money(0)).toBe('0')
  })
})
