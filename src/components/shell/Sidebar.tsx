import { NavLink } from 'react-router-dom'
import { Icon } from '../primitives'
import { NAV_PILOTAGE, NAV_COMPTE, type NavItem } from './nav'
import styles from './Sidebar.module.css'

function navClass({ isActive }: { isActive: boolean }) {
  return 'nav-item' + (isActive ? ' on' : '')
}

function NavItems({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((n) => (
        <NavLink key={n.path} to={n.path} end={n.end} className={navClass}>
          <Icon name={n.icon} size={19} /> {n.label}
        </NavLink>
      ))}
    </>
  )
}

/** Sidebar Cockpit (pattern A) — portée 1:1 de shell.jsx. */
export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={`logo ${styles.logo}`}>
        <div className="logo-mark">C</div>
        <div className="logo-name">Cauris</div>
      </div>

      <div className="nav-group">Pilotage</div>
      <NavItems items={NAV_PILOTAGE} />

      <div className="nav-group">Compte</div>
      <NavItems items={NAV_COMPTE} />

      <div className={`wf-card soft wf-pad-sm r ${styles.user}`}>
        <div className="avatar sm">A</div>
        <div className={styles.userMeta}>
          <div className={styles.userName}>Aïcha K.</div>
          <div className={`t-faint ${styles.userSub}`}>Compte personnel</div>
        </div>
      </div>
    </aside>
  )
}
