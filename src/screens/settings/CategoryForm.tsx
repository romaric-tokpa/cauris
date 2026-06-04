import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { ErrorBanner } from '../onboarding/parts'
import { useCategoryMutations, type CategoryRow } from './useCategories'
import styles from './settings.module.css'

const COLORS = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'] as const
const SWATCH: Record<string, string> = {
  'cat-1': styles.sw1,
  'cat-2': styles.sw2,
  'cat-3': styles.sw3,
  'cat-4': styles.sw4,
  'cat-5': styles.sw5,
  'cat-6': styles.sw6,
}

/**
 * Formulaire catégorie (Drawer desktop · BottomSheet mobile). Création (nom, type, couleur)
 * ou édition. « Supprimer » n'apparaît QUE si la catégorie est libre (0 opération ET 0
 * budget) — l'UI guide, le serveur garantit (409 si forcé).
 */
export function CategoryForm({
  initial,
  onClose,
  onExit,
}: {
  initial?: CategoryRow
  onClose: () => void
  /** Sortie après suppression (l'élément n'existe plus). */
  onExit?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState(initial?.kind === 'income' ? 'income' : 'expense')
  const [colorToken, setColorToken] = useState(initial?.colorToken ?? 'cat-1')
  const [error, setError] = useState('')
  const { create, update, remove } = useCategoryMutations()
  const isEdit = Boolean(initial)
  const submitting = create.isPending || update.isPending || remove.isPending
  // « Libre » = supprimable sans risque d'intégrité (cf. garde 409 serveur).
  const deletable = isEdit && initial!.txnCount === 0 && !initial!.hasBudget

  const onErr = (e: unknown) => setError(e instanceof Error ? e.message : 'Erreur réseau.')

  const submit = () => {
    setError('')
    if (!name.trim()) return setError('Nom de la catégorie requis.')
    const data = { name: name.trim(), kind, colorToken }
    if (isEdit && initial)
      update.mutate({ id: initial.id, data }, { onSuccess: onClose, onError: onErr })
    else create.mutate(data, { onSuccess: onClose, onError: onErr })
  }

  const onDelete = () => {
    if (!initial) return
    setError('')
    remove.mutate(initial.id, { onSuccess: onExit ?? onClose, onError: onErr })
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
        <span className="lbl">Nom de la catégorie</span>
        <div className="inp">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alimentation"
            aria-label="Nom de la catégorie"
            autoFocus
          />
        </div>
      </label>

      <div>
        <span className="lbl">Type</span>
        <div className="seg-full" role="group" aria-label="Type de catégorie">
          <button
            type="button"
            className={kind === 'expense' ? 'on' : ''}
            aria-pressed={kind === 'expense'}
            onClick={() => setKind('expense')}
          >
            Dépense
          </button>
          <button
            type="button"
            className={kind === 'income' ? 'on' : ''}
            aria-pressed={kind === 'income'}
            onClick={() => setKind('income')}
          >
            Revenu
          </button>
        </div>
      </div>

      <div>
        <span className="lbl">Couleur</span>
        <div className={`r ${styles.colorRow}`}>
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`${styles.swatch} ${SWATCH[c]}${colorToken === c ? ` ${styles.swatchOn}` : ''}`}
              aria-label={`Couleur ${c}`}
              aria-pressed={colorToken === c}
              onClick={() => setColorToken(c)}
            />
          ))}
        </div>
      </div>

      {deletable && (
        <button
          type="button"
          className={`btn block ${styles.deleteBtn}`}
          onClick={onDelete}
          disabled={submitting}
        >
          <Icon name="trash" size={15} /> Supprimer
        </button>
      )}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la catégorie'}
        </button>
      </div>
    </form>
  )
}
