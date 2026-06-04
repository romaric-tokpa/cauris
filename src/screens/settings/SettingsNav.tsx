import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../components/primitives'
import styles from './settings.module.css'

/** Items de la nav latérale Paramètres (SET_NAV du wireframe). `anchor` = section de la
 *  page principale ; `path` = sous-page routée ; `soon` = non livré (désactivé honnête). */
interface NavItem {
  key: string
  icon: IconName
  label: string
  anchor?: string // section de /parametres (#profil…)
  path?: string // sous-page routée (/parametres/…)
  soon?: boolean
}

const NAV: NavItem[] = [
  { key: 'profil', icon: 'user', label: 'Profil', anchor: 'profil' },
  { key: 'preferences', icon: 'gear', label: 'Préférences', anchor: 'preferences' },
  { key: 'securite', icon: 'shield', label: 'Sécurité', anchor: 'securite' },
  { key: 'categories', icon: 'tag', label: 'Catégories', path: '/parametres/categories' },
  { key: 'import-export', icon: 'download', label: 'Import / Export', path: '/parametres/import-export' },
  { key: 'sauvegarde', icon: 'card', label: 'Sauvegarde', soon: true },
  { key: 'aide', icon: 'help', label: "Centre d'aide", path: '/parametres/aide' },
]

/**
 * Nav latérale partagée (page principale + sous-pages). `onMain` rend les ancres en lien
 * natif `#section` (scroll same-page) ; ailleurs elles renvoient à `/parametres`. `active`
 * surligne la sous-page courante. « Sauvegarde » reste honnêtement désactivée (pas de page).
 */
export function SettingsNav({ active, onMain = false }: { active?: string; onMain?: boolean }) {
  return (
    <nav className="set-nav" aria-label="Sections des paramètres">
      {NAV.map((n) => {
        if (n.soon)
          return (
            <span
              key={n.key}
              className={`si2 ${styles.soon}`}
              aria-disabled="true"
              title="Bientôt disponible"
            >
              <Icon name={n.icon} size={17} /> {n.label}
            </span>
          )
        // Ancre : sur la page principale, lien natif (#section) ; sinon retour à /parametres.
        if (n.anchor) {
          const href = onMain ? `#${n.anchor}` : '/parametres'
          return (
            <a key={n.key} href={href} className="si2">
              <Icon name={n.icon} size={17} /> {n.label}
            </a>
          )
        }
        const isActive = active === n.key
        return (
          <Link
            key={n.key}
            to={n.path ?? '/parametres'}
            className={`si2${isActive ? ' on' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon name={n.icon} size={17} /> {n.label}
          </Link>
        )
      })}
    </nav>
  )
}
