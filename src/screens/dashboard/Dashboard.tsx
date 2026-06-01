import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { useDashboard } from './useDashboard'
import { DashboardDesktop } from './DashboardDesktop'
import { DashboardMobile } from './DashboardMobile'
import styles from './dashboard.module.css'

/** Squelette de chargement (sans titre h1 : l'écran n'est « prêt » qu'au succès). */
function DashboardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.skelRow} ${styles.skelKpis}`}>
        {[0, 1, 2, 3].map((i) => (
          <div className={styles.skelCard} key={i} />
        ))}
      </div>
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
      <div className={`${styles.skelCard} ${styles.skelTall}`} />
    </div>
  )
}

/** État d'erreur soigné + relance (la session e2e seedée ne devrait jamais l'atteindre). */
function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.errorWrap}>
      <Card className={styles.errorCard}>
        <div className={`big-ico ${styles.errIco}`}>
          <Icon name="alert" size={30} />
        </div>
        <div className={styles.errTitle}>Tableau de bord indisponible</div>
        <div className={`t-faint ${styles.errText}`}>
          Impossible de charger vos données pour le moment.
        </div>
        <button type="button" className="btn primary" onClick={onRetry}>
          Réessayer
        </button>
      </Card>
    </div>
  )
}

/** Écran d'accueil. Données via la façade composite `/api/dashboard` (TanStack Query).
 *  Rendu desktop (cockpit A) + mobile togglés par CSS ; un seul fetch, états soignés. */
export function Dashboard() {
  const { data, isPending, isError, refetch } = useDashboard()

  if (isPending) return <DashboardSkeleton />
  if (isError || !data) return <DashboardError onRetry={() => void refetch()} />

  return (
    <>
      <h1 className={styles.srOnly}>Tableau de bord</h1>
      <DashboardDesktop d={data} className={styles.desktop} />
      <DashboardMobile d={data} className={styles.mobile} />
    </>
  )
}
