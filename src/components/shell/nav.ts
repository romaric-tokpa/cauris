import type { IconName } from '../primitives'

export interface NavItem {
  icon: IconName
  /** Libellé recopié EXACTEMENT de NAV (design/wireframe/shell.jsx). */
  label: string
  path: string
  /** Route exacte (NavLink `end`) — pour l'index Dashboard. */
  end?: boolean
}

// Groupe « Pilotage » — libellés + icônes 1:1 de shell.jsx NAV.
export const NAV_PILOTAGE: NavItem[] = [
  { icon: 'grid', label: 'Dashboard', path: '/', end: true },
  { icon: 'exchange', label: 'Transactions', path: '/transactions' },
  { icon: 'gauge', label: 'Budgets', path: '/budgets' },
  { icon: 'target', label: 'Objectifs', path: '/objectifs' },
  { icon: 'analytics', label: 'Analytics', path: '/analytics' },
  { icon: 'message', label: 'Assistant', path: '/assistant-ia' },
  { icon: 'wallet', label: 'Comptes', path: '/comptes' },
  { icon: 'bank', label: 'Prêt / Dette', path: '/pret' },
]

// Groupe « Compte » — 1:1 de shell.jsx.
export const NAV_COMPTE: NavItem[] = [
  { icon: 'bell', label: 'Notifications', path: '/notifications' },
  { icon: 'gear', label: 'Paramètres', path: '/parametres' },
]

export const NAV_ALL: NavItem[] = [...NAV_PILOTAGE, ...NAV_COMPTE]

/** Item de nav correspondant au chemin courant (pour le titre du header mobile). */
export function findNavByPath(pathname: string): NavItem | undefined {
  if (pathname === '/') return NAV_ALL.find((n) => n.end)
  return NAV_ALL.find((n) => n.path !== '/' && pathname.startsWith(n.path))
}
