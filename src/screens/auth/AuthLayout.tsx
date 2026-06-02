import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { RouteFallback } from '../../app/guards'
import styles from './auth.module.css'

/** Coquille plein écran centrée pour les écrans d'auth (hors shell). */
export function AuthLayout() {
  return (
    <div className={styles.screen}>
      <div className={styles.panel}>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
