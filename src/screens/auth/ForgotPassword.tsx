import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../lib/auth-client'
import { Field, ErrorBanner } from './fields'
import styles from './auth.module.css'

/** Mot de passe oublié — absent du wireframe, composé token-only. Flux Better Auth réel :
 *  requestPasswordReset envoie un lien vers /auth/reinitialisation. */
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await requestPasswordReset({ email, redirectTo: '/auth/reinitialisation' })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Envoi impossible. Réessayez.')
      return
    }
    setSent(true)
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
      <div className={styles.main}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className={`c ${styles.logoText}`}>
            <div className={styles.authTitle}>Mot de passe oublié</div>
            <div className={`t-faint ${styles.authSub}`}>
              {sent ? 'Vérifiez votre boîte mail' : 'Recevez un lien de réinitialisation'}
            </div>
          </div>
        </div>

        {sent ? (
          <div className={`t-faint ${styles.note}`}>
            Si un compte existe pour <b>{email}</b>, un lien de réinitialisation vient d’être
            envoyé. Le lien expire après un court délai.
          </div>
        ) : (
          <div className={styles.fields}>
            {error && <ErrorBanner message={error} />}
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="vous@email.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className={`btn primary block ${styles.btnSubmit}`}
              disabled={loading}
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
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
