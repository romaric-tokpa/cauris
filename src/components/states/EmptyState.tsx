import type { ReactNode } from 'react'
import { Icon, type IconName } from '../primitives'
import styles from './states.module.css'

export interface EmptyStateProps {
  /** Icône de la pastille (défaut `inbox`, comme screens-states.jsx). */
  icon?: IconName
  title: string
  text: string
  /** Boutons d'action optionnels (rendus en colonne). */
  actions?: ReactNode
}

/** État vide — porté de screens-states.jsx (centré, pastille neutre). Réutilisable. */
export function EmptyState({ icon = 'inbox', title, text, actions }: EmptyStateProps) {
  return (
    <div className={`${styles.state} ${styles.empty}`}>
      <div className={`big-ico ${styles.icoNeutral}`}>
        <Icon name={icon} size={34} />
      </div>
      <div>
        <div className={styles.titleSm}>{title}</div>
        <div className={`t-faint ${styles.textEmpty}`}>{text}</div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
