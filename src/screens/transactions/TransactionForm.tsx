import { useState } from 'react'
import { Icon, type IconName } from '../../components/primitives'
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
import type { VoicePrefill } from '../../lib/voiceStub'
import styles from './transactions.module.css'

const BASE_TYPES = ['Dépense', 'Revenu', 'Transfert']
const DEFAULT_DATE = '2026-05-31' // mois de démo

/**
 * Canaux de paiement — liste FERMÉE (Lot B1), 1:1 avec `D.canaux` du wireframe.
 * Icônes : le wireframe utilise `card` pour Wave ET Orange Money (mobile money) et
 * `cash`/`bank` pour les deux autres — substitution conservée telle quelle.
 */
const CHANNELS: { id: string; label: string; icon: IconName }[] = [
  { id: 'wave', label: 'Wave', icon: 'card' },
  { id: 'orange_money', label: 'Orange Money', icon: 'card' },
  { id: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'banque', label: 'Banque', icon: 'bank' },
]

/**
 * Canal par défaut DÉRIVÉ du compte source (un chip est toujours actif, fidèle au
 * wireframe) : Espèces → cash ; nom/banque ~ Wave → wave ; ~ Orange → orange_money ;
 * autre mobile money → wave (1er chip mobile) ; sinon banque. L'utilisateur peut
 * surcharger au clic — le défaut ne se recale alors plus (cf. `channelTouched`).
 */
function defaultChannel(a: AccountRef | undefined): string {
  if (!a) return 'cash'
  const hay = `${a.name} ${a.bank}`.toLowerCase()
  if (a.type === 'Espèces' || /esp[eè]ce|cash/.test(hay)) return 'cash'
  if (/wave/.test(hay)) return 'wave'
  if (/orange/.test(hay)) return 'orange_money'
  if (a.type === 'Mobile money') return 'wave'
  return 'banque'
}

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
  channel: string // canal de paiement (toujours valide en état ; null émis au submit si Transfert)
}

function initialState(
  initial: TxnRow | undefined,
  accounts: AccountRef[],
  prefill?: VoicePrefill,
): FormState {
  // Pré-remplissage vocal (Lot B2) : on garde le compte VIDE s'il n'a pas été résolu
  // (« compte à choisir ») et le canal DICTÉ tel quel (pas de re-dérivation).
  if (prefill && !initial) {
    return {
      type: prefill.type,
      label: prefill.label,
      amount: prefill.amount,
      accountId: prefill.accountId, // '' si non résolu → placeholder « Choisir un compte »
      categoryId: prefill.categoryId,
      transferAccountId: '',
      occurredAt: prefill.occurredAt,
      note: '',
      recurring: false,
      channel: prefill.channel,
    }
  }
  const accountId = initial?.accountId ?? accounts[0]?.id ?? ''
  return {
    type: initial?.type ?? 'Dépense',
    label: initial?.label ?? '',
    amount: initial ? Math.abs(initial.amount) : 0,
    accountId,
    categoryId: initial?.categoryId ?? '',
    transferAccountId: initial?.transferAccountId ?? '',
    occurredAt: initial?.occurredAt ?? DEFAULT_DATE,
    note: initial?.note ?? '',
    recurring: false,
    // Round-trip : un canal stocké (Dépense/Revenu) se pré-remplit ; sinon (Transfert
    // → null, ou nouvelle saisie) on dérive du compte → un chip est toujours actif.
    channel: initial?.channel ?? defaultChannel(accounts.find((a) => a.id === accountId)),
  }
}

/**
 * Formulaire ajout/édition partagé (Drawer desktop · BottomSheet mobile).
 * Le client envoie la MAGNITUDE ; le serveur dérive le signe. `stacked` = mobile
 * (colonne unique). Le segment Type fait muter le corps : `Transfert` → layout dédié
 * Depuis/Vers + soldes après transfert (+ option récurrente, desktop, à la création).
 *
 * « Canal de paiement » (Lot B1) : chips Dépense/Revenu, défaut dérivé du compte
 * (un chip toujours actif), null pour un Transfert. La ventilation analytics par canal
 * reste à venir (le champ `channel` existe en base, prêt à être agrégé).
 */
export function TransactionForm({
  initial,
  accounts,
  categories,
  stacked = false,
  onClose,
  onVoice,
  onChat,
  onSms,
  prefill,
}: {
  initial?: TxnRow
  accounts: AccountRef[]
  categories: CategoryRef[]
  stacked?: boolean
  onClose: () => void
  /** Entrée « Note vocale » (Lot B2) — rangée Capture rapide, création uniquement. */
  onVoice?: () => void
  /** Entrée « Langage naturel » (Lot B3) — rangée Capture rapide, création uniquement. */
  onChat?: () => void
  /** Entrée « Depuis un SMS » (Lot B5) — rangée Capture rapide, création uniquement. */
  onSms?: () => void
  /** Pré-remplissage issu de la capture vocale/conversationnelle (Corriger) — création. */
  prefill?: VoicePrefill
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial, accounts, prefill))
  const [error, setError] = useState('')
  // Tant que l'utilisateur n'a pas cliqué un chip, le canal suit le compte choisi.
  // Un canal DICTÉ (prefill vocal) est considéré « touché » → non re-dérivé.
  const [channelTouched, setChannelTouched] = useState(Boolean(prefill))
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

  /** Changement de compte source : recale le canal par défaut TANT QUE non surchargé. */
  const onAccountChange = (v: string) =>
    setS((p) => ({
      ...p,
      accountId: v,
      channel: channelTouched ? p.channel : defaultChannel(accounts.find((a) => a.id === v)),
    }))

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
        channel: null, // Transfert = mouvement interne, pas de canal
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
      channel: s.channel,
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

      {/* Capture rapide — création uniquement. Note vocale (B2) + Langage naturel (B3)
          + Depuis un SMS (B5) RÉELS. Anti-bouton-mort. */}
      {(onVoice || onChat || onSms) && !isEdit && (
        <div>
          <span className="lbl">Capture rapide</span>
          <div className={`r ${styles.captureRow}`}>
            <button type="button" className={`btn block ${styles.captureBtn}`} onClick={onVoice}>
              <Icon name="mic" size={17} /> <span>Note vocale</span>
            </button>
            <button
              type="button"
              className={`btn block ${styles.captureBtn}`}
              onClick={onChat}
            >
              <Icon name="message" size={17} /> <span>Langage naturel</span>
            </button>
            <button type="button" className={`btn block ${styles.captureBtn}`} onClick={onSms}>
              <Icon name="phone" size={17} /> <span>Depuis un SMS</span>
            </button>
          </div>
          <div className={`r ${styles.captureDivider}`}>
            <span className={styles.captureHr} />
            <span className="t-faint">ou saisie manuelle</span>
            <span className={styles.captureHr} />
          </div>
        </div>
      )}

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

      {/* Canal de paiement — distinct du compte/catégorie (wireframe v2). Dépense/Revenu
          uniquement ; un Transfert (mouvement interne) n'a pas de canal. */}
      {!isTransfer && (
        <div>
          <span className="lbl">Canal de paiement</span>
          <div className={`r ${styles.channelRow}`} role="group" aria-label="Canal de paiement">
            {CHANNELS.map((ch) => {
              const on = s.channel === ch.id
              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`chip${on ? ' on' : ''}`}
                  aria-pressed={on}
                  onClick={() => {
                    setChannelTouched(true)
                    set('channel', ch.id)
                  }}
                >
                  <Icon name={ch.icon} size={13} /> {ch.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

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
            onChange={onAccountChange}
            // Pré-remplissage vocal non résolu (accountId vide) → invite explicite à choisir.
            placeholder={s.accountId ? undefined : 'Choisir un compte'}
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
