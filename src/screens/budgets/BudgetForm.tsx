import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Switch } from '../../components/ui'
import { money } from '../../lib/money'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { SelectField } from '../transactions/parts'
import { useCategories, type CategoryRef } from '../transactions/useTransactions'
import { useBudgetMutations, type BudgetRow } from './useBudgets'
import styles from './budgets.module.css'

const FREQUENCIES = ['Mensuel', 'Hebdo', 'Annuel']
const ALERT_PCTS = [80, 90, 100]

interface FormState {
  categoryId: string
  cap: number
  frequency: string
  alertPct: number
  rollover: boolean
}

function initialState(initial: BudgetRow | undefined): FormState {
  return {
    categoryId: initial?.categoryId ?? '',
    cap: initial?.cap ?? 0,
    frequency: initial?.frequency ?? 'Mensuel',
    alertPct: initial?.alertPct ?? 90,
    rollover: initial?.rollover ?? false,
  }
}

/**
 * Formulaire budget (Drawer desktop · BottomSheet mobile), porté de BudgetFormDesk.
 * Création (catégorie choisie) ou ajustement (catégorie fixe). Le plafond est un entier
 * FCFA ; le serveur fixe la période + le `spent` initial (dépenses dérivées de la catégorie).
 */
export function BudgetForm({ initial, onClose }: { initial?: BudgetRow; onClose: () => void }) {
  const [s, setS] = useState<FormState>(() => initialState(initial))
  const [error, setError] = useState('')
  const { create, update, archive } = useBudgetMutations()
  const categoriesQ = useCategories()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || archive.isPending
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setS((p) => ({ ...p, [k]: v }))

  // Budget = enveloppe de DÉPENSE → on propose les catégories de dépense.
  const categories = (categoriesQ.data ?? []).filter((c: CategoryRef) => c.kind === 'expense')
  const categoryOpts = categories.map((c) => ({ value: c.id, label: c.name }))

  const submit = () => {
    setError('')
    if (!s.categoryId) return setError('Catégorie requise.')
    if (!Number.isInteger(s.cap) || s.cap <= 0) return setError('Plafond positif requis.')
    const payload = {
      categoryId: s.categoryId,
      cap: s.cap,
      frequency: s.frequency,
      alertPct: s.alertPct,
      rollover: s.rollover,
    }
    const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')
    if (isEdit && initial)
      update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose, onError: onErr })
    else create.mutate(payload, { onSuccess: onClose, onError: onErr })
  }

  // Archivage = retrait de la liste active (réversible via l'onglet « Archivés » → Réactiver).
  // Vit dans le drawer d'ajustement, comme « Bloquer » vit dans l'édition d'un compte.
  const onArchive = () => {
    setError('')
    if (!initial) return
    archive.mutate(initial.id, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'Erreur réseau.'),
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

      {isEdit ? (
        // Ajustement : la catégorie est fixe (lecture seule, pas de sélecteur trompeur).
        <label>
          <span className="lbl">Catégorie</span>
          <div className="inp">
            <span>{initial?.categoryName}</span>
          </div>
        </label>
      ) : (
        <SelectField
          label="Catégorie"
          value={s.categoryId}
          options={categoryOpts}
          onChange={(v) => set('categoryId', v)}
          placeholder="Choisir…"
        />
      )}

      <MoneyInput label="Plafond mensuel" value={s.cap} onChange={(v) => set('cap', v)} />

      <div>
        <span className="lbl">Période</span>
        <div className="seg-full" role="group" aria-label="Période">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              className={f === s.frequency ? 'on' : ''}
              aria-pressed={f === s.frequency}
              onClick={() => set('frequency', f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="lbl">Alerte à</span>
        <div className={`r ${styles.alertChips}`}>
          {ALERT_PCTS.map((p) => (
            <button
              key={p}
              type="button"
              className={`chip ${styles.alertChip}` + (p === s.alertPct ? ' on' : '')}
              aria-pressed={p === s.alertPct}
              onClick={() => set('alertPct', p)}
            >
              {p} %
            </button>
          ))}
        </div>
      </div>

      <div className={`wf-card soft wf-pad-sm r between ${styles.rolloverRow}`}>
        <div>
          <div className={styles.rolloverTitle}>Reporter le solde non dépensé</div>
          <div className="t-faint">Sur le mois suivant</div>
        </div>
        <Switch
          on={s.rollover}
          label="Reporter le solde non dépensé"
          onChange={(v) => set('rollover', v)}
        />
      </div>

      {isEdit && (
        <button
          type="button"
          className={`btn block ${styles.archiveBtn}`}
          onClick={onArchive}
          disabled={submitting}
        >
          <Icon name="inbox" size={15} /> Archiver ce budget
        </button>
      )}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le budget'}
          {!isEdit && s.cap > 0 ? ` · ${money(s.cap)}` : ''}
        </button>
      </div>
    </form>
  )
}
