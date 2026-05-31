import { describe, it, expect } from 'vitest'
import { formatDateFR } from './date'

// Référence fixe pour des tests déterministes : 31 mai 2026.
const REF = new Date(2026, 4, 31)

describe('formatDateFR()', () => {
  it('formate « jour mois » sans année quand l’année est celle de référence', () => {
    expect(formatDateFR(new Date(2026, 4, 28), { reference: REF })).toBe('28 mai')
  })

  it('affiche l’année avec withYear', () => {
    expect(formatDateFR(new Date(2026, 5, 15), { reference: REF, withYear: true })).toBe(
      '15 juin 2026',
    )
  })

  it('affiche l’année si elle diffère de la référence', () => {
    expect(formatDateFR(new Date(2025, 11, 15), { reference: REF })).toBe('15 décembre 2025')
  })

  it('rend « Auj. » pour le jour de référence', () => {
    expect(formatDateFR(new Date(2026, 4, 31, 9, 30), { reference: REF })).toBe('Auj.')
  })

  it('rend « Hier » pour la veille', () => {
    expect(formatDateFR(new Date(2026, 4, 30), { reference: REF })).toBe('Hier')
  })

  it('désactive le relatif avec relative:false', () => {
    expect(formatDateFR(new Date(2026, 4, 31), { reference: REF, relative: false })).toBe('31 mai')
  })

  it('accepte une chaîne date-heure locale', () => {
    // Midi local → pas de glissement de jour selon le fuseau.
    expect(formatDateFR('2026-06-15T12:00:00', { reference: REF, withYear: true })).toBe(
      '15 juin 2026',
    )
  })
})
