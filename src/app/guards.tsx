import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '../lib/auth-client'
import styles from './guards.module.css'

/** Vrai si l'utilisateur a terminé l'onboarding (additionalField user, non typé sur le client). */
function onboarded(user: unknown): boolean {
  return (user as { onboardingComplete?: boolean } | null | undefined)?.onboardingComplete === true
}

/** Écran de chargement soigné, le temps que la session se résolve. */
function LoadingScreen() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.loadingText}>Chargement…</span>
    </div>
  )
}

/** Fallback Suspense des routes lazy-loadées (mêmes visuels que le chargement session). */
export function RouteFallback() {
  return <LoadingScreen />
}

/** Routes app : exige une session ET un onboarding terminé. */
export function RequireAuth() {
  const { data, isPending } = useSession()
  if (isPending) return <LoadingScreen />
  if (!data) return <Navigate to="/auth" replace />
  if (!onboarded(data.user)) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Routes /auth/* : un utilisateur déjà connecté + onboardé n'a rien à y faire. */
export function RequireGuest() {
  const { data, isPending } = useSession()
  if (isPending) return <LoadingScreen />
  if (data && onboarded(data.user)) return <Navigate to="/" replace />
  return <Outlet />
}

/** Route /onboarding : exige une session ; redirige si déjà onboardé. */
export function RequireOnboarding() {
  const { data, isPending } = useSession()
  if (isPending) return <LoadingScreen />
  if (!data) return <Navigate to="/auth" replace />
  if (onboarded(data.user)) return <Navigate to="/" replace />
  return <Outlet />
}
