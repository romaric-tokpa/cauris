import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Switch } from '../../components/ui'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { SelectField } from './parts'
import { useRecurrenceMutations } from './useRecurrences'
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

/** `2026-05-31` → `2026-06-01` (1er du mois suivant, pour un transfert récurrent). */
function firstOfNextMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  const ny = m === 12 ? y + 1 : y
  const nm = m === 12 ? 1 : m + 1
  return `${ny}-${String(nm).padStart(2, '0')}-01`
}

interface FormState {
  type: string
  label: string
  amount: number // magnitude positive
  accountId: string
  categoryId: string
  transferAccountId: string
  occurredAt: string
  note: string
  recurring: boolean // transfert récurrent (création uniquement)
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
    recurring: false,
  }
}

/**
 * Formulaire ajout/édition partagé (Drawer desktop · BottomSheet mobile).
 * Le client envoie la MAGNITUDE ; le serveur dérive le signe. `stacked` = mobile
 * (colonne unique). Le segment Type fait muter le corps : `Transfert` → layout dédié
 * Depuis/Vers + soldes après transfert (+ option récurrente, desktop, à la création).
 *
 * NB : « Canal de paiement » du wireframe v2 N'EST PAS porté en A1 (aucune colonne
 * `channel` en base → un chip serait un faux champ) — différé au Lot B (migration +
 * chips + ventilation analytics). Ce n'est PAS une omission définitive.
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
  // Le transfert a réussi mais la récurrence a échoué : on ne ré-émet PAS le
  // transfert au re-clic (pas de doublon) — on ne retente que la récurrence.
  const [transferCommitted, setTransferCommitted] = useState(false)
  const { create, update, remove } = useTxnMutations()
  const { create: recCreate } = useRecurrenceMutations()
  const isEdit = Boolean(initial)
  const submitting =
    create.isPending || update.isPending || remove.isPending || recCreate.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  const isTransfer = s.type === 'Transfert'
  // Préserve un type système (Récurrente) à l'édition.
  const types = !BASE_TYPES.includes(s.type) ? [...BASE_TYPES, s.type] : BASE_TYPES

  const accountOpts = accounts.map((a) => ({ value: a.id, label: a.name }))
  const categoryOpts = categories.map((cat) => ({ value: cat.id, label: cat.name }))
  // Pour un transfert, le compte porte son solde dans le libellé (fidèle au wireframe).
  const balanceOpts = accounts.map((a) => ({ value: a.id, label: `${a.name} · ${money(a.balance)}` }))

  const srcBal = accounts.find((a) => a.id === s.accountId)?.balance ?? 0
  const dstBal = accounts.find((a) => a.id === s.transferAccountId)?.balance ?? 0
  const destName = accounts.find((a) => a.id === s.transferAccountId)?.name ?? 'compte'
  const showBalances = isTransfer && Boolean(s.accountId && s.transferAccountId)

  const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')

  /** 2ᵉ appel d'un transfert récurrent : crée la récurrence liée. Échec → message clair. */
  const createLinkedRecurrence = () =>
    recCreate.mutate(
      {
        name: `Transfert vers ${destName}`,
        amount: s.amount,
        frequency: 'monthly',
        nextDate: firstOfNextMonth(s.occurredAt),
        known: true,
        categoryId: null,
        accountId: s.accountId,
      },
      {
        onSuccess: onClose,
        onError: () =>
          setError(
            "Le transfert a bien été enregistré, mais la récurrence n'a pas pu être créée. Réessayez, ou créez-la depuis l'onglet Récurrentes.",
          ),
      },
    )

  const submit = () => {
    setError('')
    if (!Number.isInteger(s.amount) || s.amount <= 0) return setError('Montant positif requis.')
    if (!s.accountId) return setError('Compte requis.')

    if (isTransfer) {
      if (!s.transferAccountId) return setError('Compte de destination requis.')
      if (s.transferAccountId === s.accountId)
        return setError('Le compte de destination doit différer du compte source.')
      // Le transfert a déjà été émis ; on ne retente que la récurrence.
      if (transferCommitted) return createLinkedRecurrence()

      const payload: TxnWritePayload = {
        type: 'Transfert',
        label: `Transfert vers ${destName}`,
        note: null,
        amount: s.amount,
        accountId: s.accountId,
        categoryId: null,
        transferAccountId: s.transferAccountId,
        occurredAt: s.occurredAt,
      }
      if (isEdit && initial) {
        update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose, onError: onErr })
        return
      }
      create.mutate(payload, {
        onSuccess: () => {
          if (s.recurring) {
            setTransferCommitted(true)
            createLinkedRecurrence()
          } else onClose()
        },
        onError: onErr,
      })
      return
    }

    // Dépense / Revenu / (Récurrente à l'édition)
    if (!s.label.trim()) return setError('Libellé requis.')
    const payload: TxnWritePayload = {
      type: s.type,
      label: s.label.trim(),
      note: !stacked && s.note.trim() ? s.note.trim() : null,
      amount: s.amount,
      accountId: s.accountId,
      categoryId: s.categoryId || null,
      transferAccountId: null,
      occurredAt: s.occurredAt,
    }
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

  const primaryLabel = (() => {
    if (submitting) return 'Enregistrement…'
    if (transferCommitted) return 'Réessayer la récurrence'
    if (isTransfer) return stacked ? 'Confirmer le transfert' : 'Transférer'
    return isEdit ? 'Enregistrer' : 'Ajouter'
  })()

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
        <div className="seg-full" role="group" aria-label="Type">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              className={t === s.type ? 'on' : ''}
              aria-pressed={t === s.type}
              onClick={() => set('type', t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!isTransfer && (
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
      )}

      <MoneyInput label="Montant" value={s.amount} onChange={(v) => set('amount', v)} />

      {isTransfer ? (
        <>
          {/* Depuis → Vers (fidèle à TransferDesk) */}
          <SelectField
            label="Depuis"
            value={s.accountId}
            options={balanceOpts}
            onChange={(v) => set('accountId', v)}
            placeholder="Choisir…"
          />
          <div className={styles.transferSwap} aria-hidden="true">
            <span className={`row-ico ${styles.swapIco}`}>
              <Icon name="exchange" size={17} />
            </span>
          </div>
          <SelectField
            label="Vers"
            value={s.transferAccountId}
            options={balanceOpts}
            onChange={(v) => set('transferAccountId', v)}
            placeholder="Choisir…"
          />
        </>
      ) : (
        <div className={stacked ? styles.formFields : styles.formGrid}>
          <SelectField
            label="Compte"
            value={s.accountId}
            options={accountOpts}
            onChange={(v) => set('accountId', v)}
          />
          <SelectField
            label="Catégorie"
            value={s.categoryId}
            options={categoryOpts}
            onChange={(v) => set('categoryId', v)}
            placeholder="Aucune"
          />
        </div>
      )}

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

      {/* Transfert récurrent : desktop, à la création uniquement (option fréquence). */}
      {isTransfer && !isEdit && !stacked && (
        <div className={`wf-card soft wf-pad-sm r between ${styles.transferRow}`}>
          <div>
            <div className={styles.transferRowTitle}>Transfert récurrent</div>
            <div className="t-faint">Chaque mois, le 1er</div>
          </div>
          <Switch
            on={s.recurring}
            label="Transfert récurrent chaque mois"
            onChange={(v) => set('recurring', v)}
          />
        </div>
      )}

      {showBalances && (
        <div className={`wf-card soft wf-pad-sm r between ${styles.transferRow}`}>
          <span className="t-muted">Soldes après transfert</span>
          <span className="t-mono">
            {money(srcBal - s.amount)} → {money(dstBal + s.amount)}
          </span>
        </div>
      )}

      {!isTransfer && !stacked && (
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
          {primaryLabel}
          {!isEdit && !isTransfer && s.amount > 0 ? ` · ${money(s.amount)}` : ''}
        </button>
      </div>
    </form>
  )
}
