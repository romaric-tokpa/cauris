import { useState } from 'react'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { SelectField } from './parts'
import { useRecurrenceMutations, type RecurrenceRow } from './useRecurrences'
import type { AccountRef, CategoryRef } from './useTransactions'
import styles from './transactions.module.css'

const DEFAULT_NEXT = '2026-07-01' // 1er du mois suivant la période de démo

interface FormState {
  name: string
  amount: number // magnitude positive
  nextDate: string
  known: boolean
  categoryId: string
  accountId: string
}

function initialState(initial: RecurrenceRow | undefined): FormState {
  return {
    name: initial?.name ?? '',
    amount: initial ? Math.abs(initial.amount) : 0,
    nextDate: initial?.nextDate ?? DEFAULT_NEXT,
    known: initial?.known ?? true,
    categoryId: initial?.categoryId ?? '',
    accountId: initial?.accountId ?? '',
  }
}

/**
 * Formulaire récurrence (Drawer desktop · BottomSheet mobile). La fréquence est
 * « Mensuel » (seule livrée) → affichée en lecture seule assumée, sans sélecteur
 * fantôme. Le client envoie la MAGNITUDE ; le serveur stocke le signe (charge).
 */
export function RecurrenceForm({
  initial,
  accounts,
  categories,
  stacked = false,
  onClose,
}: {
  initial?: RecurrenceRow
  accounts: AccountRef[]
  categories: CategoryRef[]
  stacked?: boolean
  onClose: () => void
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial))
  const [error, setError] = useState('')
  const { create, update, remove } = useRecurrenceMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || remove.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  const accountOpts = accounts.map((a) => ({ value: a.id, label: a.name }))
  const categoryOpts = categories.map((cat) => ({ value: cat.id, label: cat.name }))

  const submit = () => {
    setError('')
    if (!s.name.trim()) return setError('Libellé requis.')
    if (!Number.isInteger(s.amount) || s.amount <= 0) return setError('Montant positif requis.')
    if (!s.nextDate) return setError('Prochaine date requise.')
    const payload = {
      name: s.name.trim(),
      amount: s.amount,
      frequency: 'monthly',
      nextDate: s.nextDate,
      known: s.known,
      categoryId: s.categoryId || null,
      accountId: s.accountId || null,
    }
    const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')
    if (isEdit && initial)
      update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose, onError: onErr })
    else create.mutate(payload, { onSuccess: onClose, onError: onErr })
  }

  const onDelete = () => {
    if (!initial) return
    setError('')
    remove.mutate(initial.id, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'Suppression impossible.'),
    })
  }

  return (
    <form
      className={styles.formFields}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {error && <ErrorBanner message={error} />}

      <label>
        <span className="lbl">Libellé</span>
        <div className="inp">
          <input
            value={s.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Canal+, Loyer…"
            autoFocus
          />
        </div>
      </label>

      <MoneyInput label="Montant" value={s.amount} onChange={(v) => set('amount', v)} />

      <div className={stacked ? styles.formFields : styles.formGrid}>
        {/* Fréquence : seule « Mensuel » livrée → lecture seule assumée (pas de
            sélecteur fantôme). Pas de chevron qui suggérerait un choix. */}
        <label>
          <span className="lbl">Fréquence</span>
          <div className="inp">
            <span>Mensuel</span>
          </div>
        </label>
        <label>
          <span className="lbl">Prochaine échéance</span>
          <div className="inp">
            <input
              type="date"
              value={s.nextDate}
              onChange={(e) => set('nextDate', e.target.value)}
              aria-label="Prochaine échéance"
            />
          </div>
        </label>
      </div>

      <div>
        <span className="lbl">Statut</span>
        <div className="seg-full" role="group" aria-label="Statut">
          <button
            type="button"
            className={s.known ? 'on' : ''}
            aria-pressed={s.known}
            onClick={() => set('known', true)}
          >
            Confirmée
          </button>
          <button
            type="button"
            className={!s.known ? 'on' : ''}
            aria-pressed={!s.known}
            onClick={() => set('known', false)}
          >
            À confirmer
          </button>
        </div>
      </div>

      <div className={stacked ? styles.formFields : styles.formGrid}>
        <SelectField
          label="Catégorie"
          value={s.categoryId}
          options={categoryOpts}
          onChange={(v) => set('categoryId', v)}
          placeholder="Aucune"
        />
        <SelectField
          label="Compte"
          value={s.accountId}
          options={accountOpts}
          onChange={(v) => set('accountId', v)}
          placeholder="Aucun"
        />
      </div>

      <div className={styles.drawerActions}>
        {isEdit ? (
          <button
            type="button"
            className={`btn block ${styles.danger}`}
            onClick={onDelete}
            disabled={submitting}
          >
            Supprimer
          </button>
        ) : (
          <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          {!isEdit && s.amount > 0 ? ` · ${money(s.amount)}` : ''}
        </button>
      </div>
    </form>
  )
}
