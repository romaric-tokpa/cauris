import { useState } from 'react'
import { Icon, type IconName } from '../../components/primitives'
import { Switch } from '../../components/ui'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { useCompteMutations, type AccountRow } from './useComptes'
import styles from './comptes.module.css'

/**
 * Choix de type — LIBELLÉ du wireframe (« Banque ») mais VALEUR stockée canonique
 * (« Trésorerie », alignée sur les filtres `tabs.ts`). Cf. consigne : libellé wireframe,
 * stockage cohérent.
 */
const TYPE_CHOICES: { label: string; value: string; icon: IconName }[] = [
  { label: 'Banque', value: 'Trésorerie', icon: 'bank' },
  { label: 'Mobile money', value: 'Mobile money', icon: 'card' },
  { label: 'Espèces', value: 'Espèces', icon: 'cash' },
  { label: 'Épargne', value: 'Épargne', icon: 'target' },
]

interface FormState {
  type: string
  name: string
  bank: string
  accountNumber: string
  balance: number
}

function initialState(initial: AccountRow | undefined): FormState {
  return {
    type: initial?.type ?? 'Trésorerie',
    name: initial?.name ?? '',
    bank: initial?.bank ?? '',
    accountNumber: initial?.accountNumber ?? '',
    // Un compte bloqué masque son solde (balance = null) → 0 à l'édition (non révélé).
    balance: initial?.balance ?? 0,
  }
}

/**
 * Formulaire compte (Drawer desktop · BottomSheet mobile), porté de AccountAddDesk /
 * AccountEditDesk. Le solde est un entier FCFA. « Inclure dans le solde total » est
 * affiché mais DÉSACTIVÉ (aucune colonne dédiée → différé ; le patrimoine inclut
 * aujourd'hui tous les comptes — l'état ON reflète donc la réalité). Anti-bouton-mort.
 */
export function AccountForm({
  initial,
  stacked = false,
  onClose,
}: {
  initial?: AccountRow
  stacked?: boolean
  onClose: () => void
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial))
  const [error, setError] = useState('')
  const { create, update, block, unblock } = useCompteMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || block.isPending || unblock.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')

  const submit = () => {
    setError('')
    if (!s.name.trim()) return setError('Nom du compte requis.')
    if (!Number.isInteger(s.balance) || s.balance < 0) return setError('Solde positif ou nul requis.')
    const payload = {
      name: s.name.trim(),
      bank: s.bank.trim(),
      type: s.type,
      accountNumber: s.accountNumber.trim(),
      balance: s.balance,
    }
    if (isEdit && initial)
      update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose, onError: onErr })
    else create.mutate(payload, { onSuccess: onClose, onError: onErr })
  }

  const toggleBlock = () => {
    if (!initial) return
    setError('')
    const m = initial.blocked ? unblock : block
    m.mutate(initial.id, { onSuccess: onClose, onError: onErr })
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
        <span className="lbl">Type de compte</span>
        <div className={styles.typeGrid} role="group" aria-label="Type de compte">
          {TYPE_CHOICES.map((t) => {
            const on = s.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                className={`choice ${styles.typeChoice}${on ? ' on' : ''}`}
                aria-pressed={on}
                onClick={() => set('type', t.value)}
              >
                <Icon name={t.icon} size={22} className={on ? '' : 't-muted'} />
                <span className={styles.typeLabel}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <label>
        <span className="lbl">Nom du compte</span>
        <div className="inp">
          <input
            value={s.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Wave principal…"
            autoFocus
          />
        </div>
      </label>

      <label>
        <span className="lbl">Établissement</span>
        <div className="inp">
          <input
            value={s.bank}
            onChange={(e) => set('bank', e.target.value)}
            placeholder="Wave, NSIA Banque…"
          />
        </div>
      </label>

      <div className={stacked ? styles.formFields : styles.formGrid}>
        <MoneyInput
          label={isEdit ? 'Solde actuel' : 'Solde initial'}
          value={s.balance}
          onChange={(v) => set('balance', v)}
        />
        <label>
          <span className="lbl">N° (4 derniers)</span>
          <div className="inp">
            <input
              value={s.accountNumber}
              onChange={(e) => set('accountNumber', e.target.value)}
              placeholder="•• 88"
            />
          </div>
        </label>
      </div>

      {/* « Inclure dans le solde total » : aucune colonne dédiée → désactivé honnête
          (l'état ON reflète la réalité — tous les comptes comptent dans le patrimoine). */}
      <div className={`wf-card soft wf-pad-sm r between ${styles.includeRow}`}>
        <div className={styles.includeTitle}>Inclure dans le solde total</div>
        <Switch on label="Inclure dans le solde total" disabled title="Bientôt disponible" />
      </div>

      {isEdit && (
        <button
          type="button"
          className={`btn block ${styles.blockBtn}`}
          onClick={toggleBlock}
          disabled={submitting}
        >
          <Icon name={initial?.blocked ? 'unlock' : 'lock'} size={15} />{' '}
          {initial?.blocked ? 'Débloquer ce compte' : 'Bloquer ce compte'}
        </button>
      )}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
          {!isEdit && s.balance > 0 ? ` · ${money(s.balance)}` : ''}
        </button>
      </div>
    </form>
  )
}
