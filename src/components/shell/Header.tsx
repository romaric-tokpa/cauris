import { useState } from 'react'
import { Icon } from '../primitives'
import { ThemeControls } from '../../theme/ThemeControls'
import styles from './Header.module.css'

/** Header Cockpit — recherche, segment période (Semaine/Mois/Année, cf. CLAUDE.md),
 *  accès Apparence, notifications, profil. Porté de shell.jsx. */
export function Header() {
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  return (
    <header className={`r between ${styles.header}`}>
      <div className={`field ${styles.search}`}>
        <Icon name="search" size={17} />
        <input placeholder="Rechercher une transaction, un compte…" readOnly />
      </div>

      <div className={`r ${styles.actions}`}>
        <div className="seg">
          <button type="button">Semaine</button>
          <button type="button" className="on">
            Mois
          </button>
          <button type="button">Année</button>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Apparence"
          onClick={() => setAppearanceOpen(true)}
        >
          <Icon name="moon" size={18} />
        </button>

        <button type="button" className="icon-btn" aria-label="Notifications">
          <Icon name="bell" size={19} />
          <span className="dot" />
        </button>

        <div className="avatar">A</div>
      </div>

      <ThemeControls open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </header>
  )
}
