import { useState, type FormEvent } from 'react'
import { authClient } from '../../lib/auth-client'
import { ErrorBanner } from '../auth/fields'
import styles from './settings.module.css'

/**
 * Formulaire « Modifier le profil » (drawer/sheet). Édite le **nom affiché** via l'appel
 * Better Auth EXISTANT `authClient.updateUser` (aucun endpoint serveur ajouté). La session
 * réactive (`useSession`) propage le nouveau nom au header/avatar. L'e-mail reste en
 * lecture seule (son changement = flow de vérification, hors scope).
 */
export function ProfileForm({
  initialName,
  email,
  onClose,
}: {
  initialName: string
  email: string | undefined
  onClose: () => void
}) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = name.trim()
    if (!trimmed) return setError('Le nom ne peut pas être vide.')

    setLoading(true)
    const { error: err } = await authClient.updateUser({ name: trimmed })
    setLoading(false)
    if (err) {
      setError('Mise à jour impossible. Réessayez.')
      return
    }
    onClose()
  }

  return (
    <form className={styles.formCol} onSubmit={(e) => void submit(e)}>
      {error && <ErrorBanner message={error} />}
      <label>
        <span className="lbl">Nom affiché</span>
        <div className="inp">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aïcha Koné"
            aria-label="Nom affiché"
            autoFocus
          />
        </div>
      </label>
      <label>
        <span className="lbl">E-mail</span>
        <div className="inp">
          <input value={email ?? ''} readOnly aria-label="E-mail" className={styles.readonlyInput} />
        </div>
      </label>
      <div className={styles.formActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
