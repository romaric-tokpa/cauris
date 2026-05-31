import { Link } from 'react-router-dom'
import { Card } from '../components/ui'
import styles from './FullScreenPlaceholder.module.css'

/** Coquille plein écran HORS shell (auth / onboarding) — contenu réel en Phase 2. */
export function FullScreenPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.screen}>
      <Card className={styles.panel}>
        <div className="auth-logo">
          <div className="lm">C</div>
          <div className="logo-name">Cauris</div>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <div className={`t-faint ${styles.text}`}>{text}</div>
        <Link to="/" className="btn primary block">
          Entrer dans l’application
        </Link>
      </Card>
    </div>
  )
}
