import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../lib/auth-client'
import { PasswordField, ErrorBanner } from './fields'
import styles from './auth.module.css'

/** Réinitialisation — absente du wireframe, composée token-only. Lit le `token` du
 *  query string ; resetPassword puis retour à la connexion. Gère token absent/expiré. */
export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    const res = await resetPassword({ newPassword: password, token })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Lien invalide ou expiré. Refaites une demande.')
      return
    }
    void navigate('/auth')
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
      <div className={styles.main}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className={`c ${styles.logoText}`}>
            <div className={styles.authTitle}>Nouveau mot de passe</div>
            <div className={`t-faint ${styles.authSub}`}>Choisissez un mot de passe sécurisé</div>
          </div>
        </div>

        {!token ? (
          <div className={styles.fields}>
            <ErrorBanner message="Lien de réinitialisation invalide ou expiré." />
            <Link
              to="/auth/mot-de-passe-oublie"
              className={`btn primary block ${styles.btnSubmit}`}
            >
              Refaire une demande
            </Link>
          </div>
        ) : (
          <div className={styles.fields}>
            {error && <ErrorBanner message={error} />}
            <PasswordField
              label="Nouveau mot de passe"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordField
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="submit"
              className={`btn primary block ${styles.btnSubmit}`}
              disabled={loading}
            >
              {loading ? 'Mise à jour…' : 'Réinitialiser'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/auth" className={`card-link ${styles.footerLink}`}>
          Retour à la connexion
        </Link>
      </div>
    </form>
  )
}
