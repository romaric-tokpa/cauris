import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/primitives'
import { authClient } from '../../lib/auth-client'
import { PasswordField, ErrorBanner } from '../auth/fields'
import styles from './settings.module.css'

/** Longueur minimale — cohérente avec l'inscription (Signup.tsx, `minLength={8}`). */
const MIN_LENGTH = 8

/**
 * Formulaire « Modifier le mot de passe » (drawer/sheet). Réutilise `PasswordField`
 * (bascule afficher/masquer) + `ErrorBanner` des écrans d'auth, et l'appel Better Auth
 * EXISTANT `authClient.changePassword` (aucun endpoint serveur ajouté). Valide avant
 * envoi (actuel non vide, nouveau ≥ 8, confirmation == nouveau) ; états chargement /
 * erreur (mot de passe actuel faux) / succès soignés.
 */
export function PasswordForm({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!current) return setError('Saisissez votre mot de passe actuel.')
    if (next.length < MIN_LENGTH) return setError(`Le nouveau mot de passe doit faire au moins ${MIN_LENGTH} caractères.`)
    if (next !== confirm) return setError('La confirmation ne correspond pas au nouveau mot de passe.')
    if (next === current) return setError('Le nouveau mot de passe doit différer de l’actuel.')

    setLoading(true)
    const { error: err } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
    })
    setLoading(false)
    if (err) {
      // 400/401 Better Auth = mot de passe actuel invalide (message soigné, pas de fuite).
      setError('Mot de passe actuel incorrect. Réessayez.')
      return
    }
    setDone(true)
  }

  // Succès : confirmation + fermeture explicite.
  if (done) {
    return (
      <div className={styles.formCol}>
        <div className={`r ${styles.successRow}`}>
          <div className={`set-ico ${styles.successIco}`}>
            <Icon name="check" size={18} />
          </div>
          <div>
            <div className={styles.successTitle}>Mot de passe modifié</div>
            <div className={`t-faint ${styles.successText}`}>
              Votre nouveau mot de passe est actif sur cet appareil.
            </div>
          </div>
        </div>
        <button type="button" className="btn primary block" onClick={onClose}>
          Terminé
        </button>
      </div>
    )
  }

  return (
    <form className={styles.formCol} onSubmit={(e) => void submit(e)}>
      {error && <ErrorBanner message={error} />}
      <PasswordField
        label="Mot de passe actuel"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
      />
      <PasswordField
        label="Nouveau mot de passe"
        autoComplete="new-password"
        placeholder={`${MIN_LENGTH} caractères minimum`}
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
      />
      <PasswordField
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <div className={styles.formActions}>
        <button type="button" className="btn block" onClick={onClose} disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn primary block" disabled={loading}>
          {loading ? 'Modification…' : 'Modifier'}
        </button>
      </div>
    </form>
  )
}
