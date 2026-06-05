import { describe, it, expect } from 'vitest'
import { extractDraft, CANNED_TRANSCRIPT, SIMULATED_SMS } from './voiceStub'
import type { AccountRef, CategoryRef } from '../screens/transactions/useTransactions'

const acc = (id: string, name: string, bank = 'Mobile money'): AccountRef => ({
  id,
  name,
  bank,
  type: 'Mobile money',
  balance: 0,
  blocked: false,
})
const cat = (id: string, name: string): CategoryRef => ({ id, name, kind: 'expense', colorToken: null })

const CATS = [cat('c-ali', 'Alimentation'), cat('c-trans', 'Transport')]
const TODAY = '2026-06-05'

describe('extractDraft — phrase canonique « Wave 3 500 pour le déjeuner »', () => {
  it('résout montant, type, canal, catégorie et compte quand un compte « Wave » existe', () => {
    const draft = extractDraft(CANNED_TRANSCRIPT, [acc('a-wave', 'Wave')], CATS, TODAY)
    expect(draft.resolved).toBe(true)
    expect(draft.prefill).toMatchObject({
      type: 'Dépense',
      amount: 3500,
      channel: 'wave',
      accountId: 'a-wave',
      categoryId: 'c-ali',
      occurredAt: TODAY,
    })
    expect(draft.prefill.label).toBe('Déjeuner')
    // Compte = Sûr (high) quand résolu.
    expect(draft.fields.find((f) => f.label === 'Compte')?.conf).toBe('high')
  })

  it('NON RÉSOLU : sans compte nommé « Wave » → accountId vide, compte en confiance low', () => {
    const draft = extractDraft(CANNED_TRANSCRIPT, [acc('a-nsia', 'Compte courant', 'NSIA Banque')], CATS, TODAY) // prettier-ignore
    expect(draft.resolved).toBe(false)
    expect(draft.prefill.accountId).toBe('')
    // Le canal dicté reste résolu (wave) même si le compte ne l'est pas.
    expect(draft.prefill.channel).toBe('wave')
    expect(draft.prefill.amount).toBe(3500)
    expect(draft.fields.find((f) => f.label === 'Compte')?.conf).toBe('low')
  })
})

describe('extractDraft — texte libre (saisie conversationnelle B3)', () => {
  it('« Orange Money 25000 pour le courant » → Dépense 25000, canal+compte Orange Money, Factures', () => {
    const draft = extractDraft(
      'Orange Money 25000 pour le courant',
      [acc('a-om', 'Orange Money')],
      [cat('c-fac', 'Factures')],
      TODAY,
    )
    expect(draft.resolved).toBe(true)
    expect(draft.prefill).toMatchObject({
      type: 'Dépense',
      amount: 25000,
      channel: 'orange_money',
      accountId: 'a-om',
      categoryId: 'c-fac', // « courant » = électricité → Factures (usage local)
    })
  })

  it('« J\'ai reçu 150000 sur mon compte principal » → Revenu 150000 ; compte NON RÉSOLU (cas normal)', () => {
    const draft = extractDraft(
      "J'ai reçu 150000 sur mon compte principal",
      [acc('a-cc', 'Compte courant', 'NSIA Banque'), acc('a-ep', 'Épargne', 'Ecobank')],
      CATS,
      TODAY,
    )
    expect(draft.prefill.type).toBe('Revenu')
    expect(draft.prefill.amount).toBe(150000)
    // « principal » ne correspond à aucun compte (et « compte » est un stopword) → non résolu.
    expect(draft.resolved).toBe(false)
    expect(draft.prefill.accountId).toBe('')
  })

  it('résout un compte par mot significatif de son nom (« vers mon courant »)', () => {
    const draft = extractDraft(
      'Transfert 5000 vers mon courant',
      [acc('a-cc', 'Compte courant', 'NSIA Banque')],
      CATS,
      TODAY,
    )
    expect(draft.resolved).toBe(true)
    expect(draft.prefill.accountId).toBe('a-cc')
  })
})

describe('extractDraft — SMS canoniques (B5, canal dans le texte)', () => {
  it('SMS Wave « Paiement de 3 500 FCFA … via Wave » → Dépense 3500 / canal wave', () => {
    const draft = extractDraft(SIMULATED_SMS[0].raw, [acc('a-wave', 'Wave')], CATS, TODAY)
    expect(draft.prefill).toMatchObject({ type: 'Dépense', amount: 3500, channel: 'wave', accountId: 'a-wave' }) // prettier-ignore
    expect(draft.resolved).toBe(true)
  })

  it('SMS Orange Money « Transfert reçu de 150 000 … » → Revenu 150000 / canal orange_money', () => {
    const draft = extractDraft(SIMULATED_SMS[1].raw, [acc('a-om', 'Orange Money')], CATS, TODAY)
    expect(draft.prefill).toMatchObject({ type: 'Revenu', amount: 150000, channel: 'orange_money', accountId: 'a-om' }) // prettier-ignore
    expect(draft.resolved).toBe(true)
  })

  it('SMS sans compte correspondant → NON RÉSOLU (cas normal)', () => {
    const draft = extractDraft(SIMULATED_SMS[0].raw, [acc('a-cc', 'Compte courant', 'NSIA')], CATS, TODAY) // prettier-ignore
    expect(draft.resolved).toBe(false)
    expect(draft.prefill.accountId).toBe('')
    expect(draft.prefill.channel).toBe('wave')
  })
})
