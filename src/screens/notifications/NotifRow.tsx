import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { formatDateFR } from '../../lib/date'
import type { NotificationItem } from './useNotifications'
import styles from './notifications.module.css'

/**
 * Référence « aujourd'hui » de démo (période de réf. produit = Mai 2026, jour courant
 * = 1er juin). Fixe → horodatages DÉTERMINISTES (« Auj. »/« Hier »/« 28 mai ») pour
 * des baselines stables (formatDateFR utilise sinon l'horloge réelle).
 */
const NOTIF_NOW = new Date('2026-06-01T12:00:00')

/** Ton → classe de pastille d'icône (couleurs via tokens, jamais en dur). */
function toneClass(tone: NotificationItem['tone']): string {
  if (tone === 'over') return styles.toneOver
  if (tone === 'warn') return styles.toneWarn
  if (tone === 'ok') return styles.toneOk
  return styles.toneNeutral
}

interface Props {
  n: NotificationItem
  compact?: boolean
  /** Appelé au clic d'une notif à href (marque lu avant navigation). */
  onActivate?: (n: NotificationItem) => void
}

/** Ligne de notification — portée 1:1 de NotifRow (screens-notifications.jsx). */
export function NotifRow({ n, compact = false, onActivate }: Props) {
  const when = formatDateFR(n.createdAt, { reference: NOTIF_NOW })
  const inner = (
    <>
      <div className={`row-ico ${compact ? styles.icoSm : styles.ico} ${toneClass(n.tone)}`}>
        <Icon name={n.icon} size={compact ? 16 : 18} />
      </div>
      <div className={styles.content}>
        <div className={`r ${styles.titleRow}`}>
          {!n.read && <span className={styles.unreadDot} />}
          <span className={`${styles.title} ${compact ? styles.titleSm : ''}`}>{n.title}</span>
        </div>
        <div className={`t-muted ${compact ? styles.subSm : styles.sub}`}>{n.body}</div>
      </div>
      <div className={`c ${styles.meta}`}>
        <span className={`t-faint ${styles.when}`}>{when}</span>
        <Icon name="chevron" size={14} className="t-faint" />
      </div>
    </>
  )

  const cls = `row-line ${styles.row} ${compact ? styles.rowSm : ''}`
  if (n.href) {
    return (
      <Link to={n.href} className={`${cls} ${styles.clickable}`} onClick={() => onActivate?.(n)}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
