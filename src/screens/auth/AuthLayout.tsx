import { Outlet } from 'react-router-dom'
import styles from './auth.module.css'

/** Coquille plein écran centrée pour les écrans d'auth (hors shell). */
export function AuthLayout() {
  return (
    <div className={styles.screen}>
      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  )
}
