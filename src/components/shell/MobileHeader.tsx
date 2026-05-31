import { useLocation } from 'react-router-dom'
import { Icon } from '../primitives'
import { findNavByPath } from './nav'
import styles from './MobileHeader.module.css'

/** App bar mobile — porté 1:1 de MobShell (titre/sous-titre, cloche+dot, avatar,
 *  back optionnel). La fausse barre d'état iOS (phone-bar) n'est PAS reprise :
 *  c'est du chrome OS de l'artboard, pas de l'UI applicative. */
export function MobileHeader({
  className = '',
  back = false,
  onBack,
}: {
  className?: string
  back?: boolean
  onBack?: () => void
}) {
  const { pathname } = useLocation()
  const title = findNavByPath(pathname)?.label ?? 'Cauris'
  return (
    <div className={`r between ${styles.header} ${className}`}>
      <div className={`r ${styles.left}`}>
        {back && (
          <button
            type="button"
            className={`icon-btn ${styles.backBtn}`}
            aria-label="Retour"
            onClick={onBack}
          >
            <span className={styles.backGlyph}>
              <Icon name="chevron" size={17} />
            </span>
          </button>
        )}
        <div className={styles.titles}>
          <div className={`t-faint ${styles.sub}`}>Mai 2026</div>
          <div className={styles.title}>{title}</div>
        </div>
      </div>
      <div className={`r ${styles.right}`}>
        <button type="button" className={`icon-btn ${styles.bell}`} aria-label="Notifications">
          <Icon name="bell" size={17} />
          <span className="dot" />
        </button>
        <div className="avatar">A</div>
      </div>
    </div>
  )
}
