import { useState } from 'react'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { SelectField } from './parts'
import {
  useTxnMutations,
  type TxnRow,
  type AccountRef,
  type CategoryRef,
  type TxnWritePayload,
} from './useTransactions'
import styles from './transactions.module.css'

const BASE_TYPES = ['Dépense', 'Revenu', 'Transfert']
const DEFAULT_DATE = '2026-05-31' // mois de démo

interface FormState {
  type: string
  label: string
  amount: number // magnitude positive
  accountId: string
  categoryId: string
  transferAccountId: string
  occurredAt: string
  note: string
}

function initialState(initial: TxnRow | undefined, accounts: AccountRef[]): FormState {
  return {
    type: initial?.type ?? 'Dépense',
    label: initial?.label ?? '',
    amount: initial ? Math.abs(initial.amount) : 0,
    accountId: initial?.accountId ?? accounts[0]?.id ?? '',
    categoryId: initial?.categoryId ?? '',
    transferAccountId: initial?.transferAccountId ?? '',
    occurredAt: initial?.occurredAt ?? DEFAULT_DATE,
    note: initial?.note ?? '',
  }
}

/**
 * Formulaire ajout/édition partagé (Drawer desktop · BottomSheet mobile).
 * Le client envoie la MAGNITUDE ; le serveur dérive le signe. `stacked` = mobile
 * (colonne unique, sans Note, fidèle à TxnAddMob).
 */
export function TransactionForm({
  initial,
  accounts,
  categories,
  stacked = false,
  onClose,
}: {
  initial?: TxnRow
  accounts: AccountRef[]
  categories: CategoryRef[]
  stacked?: boolean
  onClose: () => void
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial, accounts))
  const [error, setError] = useState('')
  const { create, update, remove } = useTxnMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || remove.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  const isTransfer = s.type === 'Transfert'
  // Préserve un type système (Récurrente) à l'édition.
  const types = !BASE_TYPES.includes(s.type) ? [...BASE_TYPES, s.type] : BASE_TYPES

  const accountOpts = accounts.map((a) => ({ value: a.id, label: a.name }))
  const categoryOpts = categories.map((cat) => ({ value: cat.id, label: cat.name }))

  const submit = () => {
    setError('')
    if (!s.label.trim()) return setError('Libellé requis.')
    if (!Number.isInteger(s.amount) || s.amount <= 0) return setError('Montant positif requis.')
    if (!s.accountId) return setError('Compte requis.')
    if (isTransfer) {
      if (!s.transferAccountId) return setError('Compte de destination requis.')
      if (s.transferAccountId === s.accountId)
        return setError('Le compte de destination doit différer du compte source.')
    }
    const payload: TxnWritePayload = {
      type: s.type,
      label: s.label.trim(),
      note: !stacked && s.note.trim() ? s.note.trim() : null,
      amount: s.amount,
      accountId: s.accountId,
      categoryId: isTransfer ? null : s.categoryId || null,
      transferAccountId: isTransfer ? s.transferAccountId : null,
      occurredAt: s.occurredAt,
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

      <div>
        <span className="lbl">Type</span>
        <div className="seg-full">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={t === s.type ? 'on' : ''}
              onClick={() => set('type', t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label>
        <span className="lbl">Libellé</span>
        <div className="inp">
          <input
            value={s.label}
            onChange={(e) => set('label', e.target.value)}
            placeholder="Marché de Cocody…"
            autoFocus
          />
        </div>
      </label>

      <MoneyInput label="Montant" value={s.amount} onChange={(v) => set('amount', v)} />

      <div className={stacked ? styles.formFields : styles.formGrid}>
        <SelectField
          label="Compte"
          value={s.accountId}
          options={accountOpts}
          onChange={(v) => set('accountId', v)}
        />
        {isTransfer ? (
          <SelectField
            label="Vers le compte"
            value={s.transferAccountId}
            options={accountOpts}
            onChange={(v) => set('transferAccountId', v)}
            placeholder="Choisir…"
          />
        ) : (
          <SelectField
            label="Catégorie"
            value={s.categoryId}
            options={categoryOpts}
            onChange={(v) => set('categoryId', v)}
            placeholder="Aucune"
          />
        )}
      </div>

      <label>
        <span className="lbl">Date</span>
        <div className="inp">
          <input
            type="date"
            value={s.occurredAt}
            onChange={(e) => set('occurredAt', e.target.value)}
          />
        </div>
      </label>

      {!stacked && (
        <label>
          <span className="lbl">Note (optionnel)</span>
          <div className="inp">
            <input
              value={s.note}
              onChange={(e) => set('note', e.target.value)}
              placeholder="Marché hebdomadaire…"
            />
          </div>
        </label>
      )}

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
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
          {!isEdit && s.amount > 0 ? ` · ${money(s.amount)}` : ''}
        </button>
      </div>
    </form>
  )
}
