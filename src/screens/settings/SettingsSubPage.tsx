import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { SettingsNav } from './SettingsNav'
import styles from './settings.module.css'

/**
 * Coque partagée des sous-pages Paramètres (SettingsPage de screens-settings-pages.jsx
 * en desktop ; MobShell `back` de screens-settings-mob.jsx en mobile). Un seul en-tête
 * (le retour mobile et la nav latérale desktop s'affichent/se cachent par média), et le
 * contenu n'est rendu QU'UNE fois (pas de doublon d'éléments interactifs).
 */
export function SettingsSubPage({
  active,
  eyebrow,
  title,
  actions,
  children,
}: {
  active: string
  eyebrow: string
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  useSetPageTitle(title)
  const navigate = useNavigate()
  return (
    <div className={styles.subPage}>
      <div className={`r between ${styles.subHead}`}>
        <div className={`r ${styles.subHeadLeft}`}>
          <button
            type="button"
            className={`icon-btn ${styles.backBtnMob}`}
            aria-label="Retour aux réglages"
            onClick={() => void navigate('/parametres')}
          >
            <Icon name="chevron" size={17} className={styles.flip} />
          </button>
          <div>
            <div className="t-eyebrow">{eyebrow}</div>
            <h1 className={styles.pageTitle}>{title}</h1>
          </div>
        </div>
        {actions && <div className={`r ${styles.headActions}`}>{actions}</div>}
      </div>

      <div className={styles.subGrid}>
        <div className={styles.navCol}>
          <SettingsNav active={active} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
