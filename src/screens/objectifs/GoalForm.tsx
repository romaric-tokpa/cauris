import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Switch } from '../../components/ui'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { useGoalMutations, type GoalRow } from './useObjectifs'
import styles from './objectifs.module.css'

interface FormState {
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string // '' | YYYY-MM-DD
}

function initialState(initial: GoalRow | undefined): FormState {
  return {
    name: initial?.name ?? '',
    targetAmount: initial?.targetAmount ?? 0,
    currentAmount: initial?.currentAmount ?? 0,
    targetDate: initial?.targetDate ?? '',
  }
}

/**
 * Formulaire objectif (Drawer desktop · BottomSheet mobile), porté de ObjCreateDesk.
 * Création (tous les champs) ou modification (sans « Déjà épargné » — `currentAmount`
 * reste piloté par les contributions). « Compte dédié » et « Contribution automatique »
 * sont DÉCORATIFS dans le wireframe : rendus en désactivé honnête, jamais persistés.
 */
export function GoalForm({
  initial,
  onClose,
  onExit,
  hasContributions = false,
}: {
  initial?: GoalRow
  onClose: () => void
  /** Sortie de cycle de vie (archive/suppression) : l'objectif disparaît → on quitte le détail. */
  onExit?: () => void
  /** Vrai si l'objectif a au moins une contribution → suppression dure interdite (archiver). */
  hasContributions?: boolean
}) {
  const [s, setS] = useState<FormState>(() => initialState(initial))
  const [error, setError] = useState('')
  const { create, update, archive, remove } = useGoalMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || archive.isPending || remove.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')
  const exit = onExit ?? onClose

  // Archivage = retrait de la liste (réversible). Vit dans le drawer de modification,
  // comme « Bloquer ce compte » / « Archiver ce budget ».
  const onArchive = () => {
    if (!initial) return
    setError('')
    archive.mutate(initial.id, { onSuccess: exit, onError: onErr })
  }
  // Suppression dure : offerte SEULEMENT sans contribution (sinon le serveur renvoie 409).
  const onDelete = () => {
    if (!initial) return
    setError('')
    remove.mutate(initial.id, { onSuccess: exit, onError: onErr })
  }

  const submit = () => {
    setError('')
    if (!s.name.trim()) return setError('Nom de l’objectif requis.')
    if (!Number.isInteger(s.targetAmount) || s.targetAmount <= 0)
      return setError('Montant cible positif requis.')
    const targetDate = s.targetDate || null
    if (isEdit && initial)
      update.mutate(
        { id: initial.id, data: { name: s.name.trim(), targetAmount: s.targetAmount, targetDate } },
        { onSuccess: onClose, onError: onErr },
      )
    else
      create.mutate(
        {
          name: s.name.trim(),
          targetAmount: s.targetAmount,
          currentAmount: s.currentAmount,
          targetDate,
        },
        { onSuccess: onClose, onError: onErr },
      )
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
        <span className="lbl">Nom de l’objectif</span>
        <div className="inp">
          <input
            value={s.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Voyage à Dakar"
            aria-label="Nom de l’objectif"
          />
        </div>
      </label>

      <MoneyInput
        label="Montant cible"
        value={s.targetAmount}
        onChange={(v) => set('targetAmount', v)}
      />

      {/* « Déjà épargné » : création seule (en édition, current_amount = contributions). */}
      <div className={isEdit ? '' : styles.formGrid2}>
        {!isEdit && (
          <MoneyInput
            label="Déjà épargné"
            value={s.currentAmount}
            onChange={(v) => set('currentAmount', v)}
          />
        )}
        <label>
          <span className="lbl">Date cible</span>
          <div className="inp">
            <input
              type="date"
              value={s.targetDate}
              onChange={(e) => set('targetDate', e.target.value)}
              aria-label="Date cible"
            />
          </div>
        </label>
      </div>

      {/* DÉCORATIFS wireframe (non persistés) → désactivés honnêtes, pas des boutons morts. */}
      <label>
        <span className="lbl">Compte dédié</span>
        <div className={`inp ${styles.soonInp}`} aria-disabled="true" title="Bientôt disponible">
          <span className="t-faint">Bientôt disponible</span>
          <Icon name="chevron" size={15} className="t-faint" />
        </div>
      </label>

      <div className={`wf-card soft wf-pad-sm r between ${styles.autoRow}`}>
        <div>
          <div className={styles.autoTitle}>Contribution automatique</div>
          <div className="t-faint">Chaque mois vers cet objectif</div>
        </div>
        <Switch on={false} label="Contribution automatique" disabled title="Bientôt disponible" />
      </div>

      {/* Sortie de cycle de vie (modification seule) : Archiver (sobre, réversible) +
          Supprimer (destructif) UNIQUEMENT sans contribution — sinon on archive. */}
      {isEdit && (
        <>
          <button
            type="button"
            className={`btn block ${styles.archiveBtn}`}
            onClick={onArchive}
            disabled={submitting}
          >
            <Icon name="inbox" size={15} /> Archiver cet objectif
          </button>
          {!hasContributions && (
            <button
              type="button"
              className={`btn block ${styles.deleteBtn}`}
              onClick={onDelete}
              disabled={submitting}
            >
              <Icon name="trash" size={15} /> Supprimer
            </button>
          )}
        </>
      )}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l’objectif'}
          {!isEdit && s.targetAmount > 0 ? ` · ${money(s.targetAmount)}` : ''}
        </button>
      </div>
    </form>
  )
}
