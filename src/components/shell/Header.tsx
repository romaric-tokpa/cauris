import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../primitives'
import { ThemeControls } from '../../theme/ThemeControls'
import { useUnreadCount } from '../../screens/notifications/useNotifications'
import { useSession } from '../../lib/auth-client'
import { initial } from '../../lib/userName'
import styles from './Header.module.css'

/** Header Cockpit — recherche, segment période (Jour/Semaine/Mois/Année, Mois actif,
 *  recopié 1:1 de shell.jsx), accès Apparence, notifications, profil. */
export function Header({ className = '' }: { className?: string }) {
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const navigate = useNavigate()
  const unreadCount = useUnreadCount()
  const name = useSession().data?.user?.name
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
        {/* Segment période recopié 1:1 du wireframe. L'app n'opère aujourd'hui QUE
         *  sur le mois (« Mai 2026 ») : « Mois » est l'état réel actif, les autres
         *  portées ne sont pas implémentées → honnêtement désactivées (disabled +
         *  title) plutôt que cliquables sans effet. Pas de dim (fidélité §rendu :
         *  recopie 1:1) ; le `disabled` retire l'affordance de clic trompeuse. */}
        <div className="seg" role="group" aria-label="Période">
          <button type="button" aria-pressed={false} disabled title="Bientôt disponible">
            Jour
          </button>
          <button type="button" aria-pressed={false} disabled title="Bientôt disponible">
            Semaine
          </button>
          {/* Mois actif rendu visible (mois de réf. de l'app) — honnêteté du contexte. */}
          <button type="button" className="on" aria-pressed={true}>
            Mois · Mai 2026
          </button>
          <button type="button" aria-pressed={false} disabled title="Bientôt disponible">
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

        <div className="avatar">{initial(name)}</div>
      </div>

      <ThemeControls open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </header>
  )
}
