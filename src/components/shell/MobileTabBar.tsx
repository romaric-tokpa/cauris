import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon } from '../primitives'
import { BottomSheet } from '../ui'
import { NAV_ALL } from './nav'

function tabClass({ isActive }: { isActive: boolean }) {
  return 'tab' + (isActive ? ' on' : '')
}

// Onglets principaux ; les autres modules vivent dans la feuille « Plus ».
const MAIN_PATHS = ['/', '/transactions', '/budgets']

/** Barre basse mobile — entrées recopiées 1:1 de MobShell : Accueil / Transac. /
 *  [FAB +] / Budgets / Plus. « Plus » ouvre une feuille listant tous les modules. */
export function MobileTabBar({ className = '' }: { className?: string }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const moreActive = !MAIN_PATHS.includes(pathname)

  return (
    <>
      <nav className={`tabbar ${className}`} aria-label="Navigation principale">
        <NavLink to="/" end className={tabClass}>
          <Icon name="home" size={20} /> Accueil
        </NavLink>
        <NavLink to="/transactions" className={tabClass}>
          <Icon name="exchange" size={20} /> Transac.
        </NavLink>
        <button type="button" className="fab" aria-label="Ajouter">
          <Icon name="plus" size={22} />
        </button>
        <NavLink to="/budgets" className={tabClass}>
          <Icon name="gauge" size={20} /> Budgets
        </NavLink>
        <button
          type="button"
          className={'tab' + (moreActive ? ' on' : '')}
          aria-haspopup="dialog"
          onClick={() => setMoreOpen(true)}
        >
          <Icon name="more" size={20} /> Plus
        </button>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Tous les modules">
        <div className="set-nav">
          {NAV_ALL.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.end}
              className="si2"
              onClick={() => setMoreOpen(false)}
            >
              <Icon name={n.icon} size={18} /> {n.label}
            </NavLink>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
