import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { signIn } from '../../lib/auth-client'
import { Field, PasswordField, ErrorBanner } from './fields'
import styles from './auth.module.css'

/** Connexion — portée 1:1 de screens-auth.jsx (AuthLogin), champs réels + Better Auth. */
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn.email({ email, password })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Connexion impossible. Vérifiez vos identifiants.')
      return
    }
    void navigate('/')
  }

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
      <div className={styles.main}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className={`c ${styles.logoText}`}>
            <div className={styles.authTitle}>Bon retour</div>
            <div className={`t-faint ${styles.authSub}`}>Connectez-vous pour continuer</div>
          </div>
        </div>

        <div className={styles.fields}>
          {error && <ErrorBanner message={error} />}
          <Field
            label="Email ou téléphone"
            type="email"
            autoComplete="email"
            placeholder="aicha.kone@email.ci"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordField
            label="Mot de passe"
            autoComplete="current-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className={styles.forgotRow}>
            <Link to="/auth/mot-de-passe-oublie" className={`card-link ${styles.linkSm}`}>
              Mot de passe oublié ?
            </Link>
          </div>
          <button
            type="submit"
            className={`btn primary block ${styles.btnSubmit}`}
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>

        <div className={styles.divider}>
          <span className={styles.hr} /> ou <span className={styles.hr} />
        </div>
        <button
          type="button"
          className={`btn block ${styles.btnBio}`}
          disabled
          title="Bientôt disponible"
        >
          <Icon name="shield" size={17} /> Connexion biométrique
        </button>
      </div>

      <div className={styles.footer}>
        <span className="t-faint">Pas encore de compte ?</span>
        <Link to="/auth/inscription" className={`card-link ${styles.footerLink}`}>
          Inscription
        </Link>
      </div>
    </form>
  )
}
