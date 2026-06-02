import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../primitives'
import { ThemeControls } from '../../theme/ThemeControls'
import { useUnreadCount } from '../../screens/notifications/useNotifications'
import styles from './Header.module.css'

/** Header Cockpit — recherche, segment période (Jour/Semaine/Mois/Année, Mois actif,
 *  recopié 1:1 de shell.jsx), accès Apparence, notifications, profil. */
export function Header({ className = '' }: { className?: string }) {
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const navigate = useNavigate()
  const unreadCount = useUnreadCount()
  return (
    <header className={`r between ${styles.header} ${className}`}>
      <div className={`field ${styles.search}`}>
        <Icon name="search" size={17} />
        <input
          placeholder="Rechercher une transaction, un compte…"
          aria-label="Rechercher une transaction, un compte"
          readOnly
        />
      </div>

      <div className={`r ${styles.actions}`}>
        <div className="seg" role="group" aria-label="Période">
          <button type="button" aria-pressed={false}>
            Jour
          </button>
          <button type="button" aria-pressed={false}>
            Semaine
          </button>
          <button type="button" className="on" aria-pressed={true}>
            Mois
          </button>
          <button type="button" aria-pressed={false}>
            Année
          </button>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Apparence"
          onClick={() => setAppearanceOpen(true)}
        >
          <Icon name="moon" size={18} />
        </button>

        <button
          type="button"
          className="icon-btn"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : 'Notifications'
          }
          onClick={() => void navigate('/notifications')}
        >
          <Icon name="bell" size={19} />
          {unreadCount > 0 && <span className="dot" />}
        </button>

        <div className="avatar">A</div>
      </div>

      <ThemeControls open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </header>
  )
}
