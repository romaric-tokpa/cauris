import { describe, it, expect } from 'vitest'
import { routeChatQuestion } from './coachChat'

describe('routeChatQuestion — routage honnête (regex fermées)', () => {
  it('« tenir jusqu’à la fin du mois » → coach survive', () => {
    expect(routeChatQuestion('Est-ce que je tiens jusqu’à la fin du mois ?')).toEqual({
      kind: 'coach',
      scenario: 'survive',
      amount: 0,
    })
    expect(routeChatQuestion('Quel sera mon solde en fin de mois ?')).toMatchObject({
      kind: 'coach',
      scenario: 'survive',
    })
  })

  it('« dépenser/m’offrir + montant » → coach afford(X), montant extrait', () => {
    expect(routeChatQuestion('Puis-je dépenser 250000 ?')).toEqual({
      kind: 'coach',
      scenario: 'afford',
      amount: 250000,
    })
    expect(routeChatQuestion('Puis-je m’offrir un téléphone à 250 000 FCFA ?')).toEqual({
      kind: 'coach',
      scenario: 'afford',
      amount: 250000,
    })
  })

  it('« dépenser » SANS montant → pas afford → retombe sur data (intention dépense)', () => {
    expect(routeChatQuestion('Comment dépenser moins ?').kind).toBe('data')
  })

  it('intention de donnée simple → data (stub existant, ancré)', () => {
    expect(routeChatQuestion('Où part mon argent ce mois-ci ?').kind).toBe('data')
    expect(routeChatQuestion('Vais-je dépasser un budget ?').kind).toBe('data')
    expect(routeChatQuestion('Quel est mon patrimoine ?').kind).toBe('data')
  })

  it('aucun match → unknown (jamais une généralité simulée)', () => {
    expect(routeChatQuestion('Quel temps fait-il à Abidjan ?').kind).toBe('unknown')
    expect(routeChatQuestion('Raconte-moi une blague').kind).toBe('unknown')
  })
})
