import { Icon } from '../components/primitives'
import { Card } from '../components/ui'
import styles from './ModulePage.module.css'

/** Page module squelette (Bloc 3) : titre + état vide soigné, rendue dans l'Outlet. */
export function ModulePage({ title }: { title: string }) {
  return (
    <>
      <div>
        <div className="t-eyebrow">Mai 2026</div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <Card pad={false} className={styles.empty}>
        <div className={`big-ico ${styles.emptyIco}`}>
          <Icon name="inbox" size={34} />
        </div>
        <div>
          <div className={styles.emptyTitle}>Module « {title} »</div>
          <div className={`t-faint ${styles.emptyText}`}>
            Écran en cours de construction. Le contenu arrivera dans une prochaine phase.
          </div>
        </div>
      </Card>
    </>
  )
}
