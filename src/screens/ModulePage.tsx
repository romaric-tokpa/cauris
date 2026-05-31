import { EmptyState } from '../components/states'
import styles from './ModulePage.module.css'

/** Page module squelette (Bloc 3/4) : titre + état vide réutilisable, dans l'Outlet. */
export function ModulePage({ title }: { title: string }) {
  return (
    <>
      <div>
        <div className="t-eyebrow">Mai 2026</div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      <EmptyState
        title={`Module « ${title} »`}
        text="Écran en cours de construction. Le contenu arrivera dans une prochaine phase."
      />
    </>
  )
}
