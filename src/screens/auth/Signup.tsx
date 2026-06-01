import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { signUp } from '../../lib/auth-client'
import { Field, PasswordField, ErrorBanner } from './fields'
import styles from './auth.module.css'

/** Inscription — portée 1:1 de screens-auth.jsx (AuthSignup), champs réels + Better Auth.
 *  Le téléphone est collecté (fidélité wireframe) mais non persisté (auth tél. = plugin futur). */
export function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!accepted) return
    setError('')
    setLoading(true)
    const res = await signUp.email({ name, email, password })
    if (res.error) {
      setLoading(false)
      setError(res.error.message ?? 'Création du compte impossible. Réessayez.')
      return
    }
    // Rechargement complet : la garde repart d'une session fraîche → /onboarding.
    window.location.assign('/')
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
      <div className={`${styles.main} ${styles.mainSignup}`}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className={`c ${styles.logoText}`}>
            <div className={styles.authTitle}>Créer un compte</div>
            <div className={`t-faint ${styles.authSub}`}>Quelques infos pour démarrer</div>
          </div>
        </div>

        <div className={`${styles.fields} ${styles.fieldsSignup}`}>
          {error && <ErrorBanner message={error} />}
          <Field
            label="Nom complet"
            autoComplete="name"
            placeholder="Aïcha Koné"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="vous@email.ci"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Field
            label="Téléphone"
            type="tel"
            autoComplete="tel"
            placeholder="+225 07 •• •• ••"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <PasswordField
            label="Mot de passe"
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className={styles.termsRow}>
            <input
              type="checkbox"
              className={styles.srOnly}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span className={'checkbox' + (accepted ? ' on' : '')} aria-hidden="true">
              {accepted && <Icon name="check" size={14} />}
            </span>
            <span className={styles.termsText}>
              J’accepte les <span className={styles.termsLink}>conditions d’utilisation</span> et la
              politique de confidentialité.
            </span>
          </label>

          <button
            type="submit"
            className={`btn primary block ${styles.btnSubmit} ${styles.mt4}`}
            disabled={loading || !accepted}
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </div>
      </div>

      <div className={styles.footer}>
        <span className="t-faint">Déjà un compte ?</span>
        <Link to="/auth" className={`card-link ${styles.footerLink}`}>
          Connexion
        </Link>
      </div>
    </form>
  )
}
