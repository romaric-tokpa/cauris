import type { ReactNode } from 'react'
import { Icon, type IconName } from '../../components/primitives'
import styles from './settings.module.css'

/** Ligne de réglage `.set-row` : pastille d'icône + label/sous-texte + contrôle à droite.
 *  `danger` teinte la pastille en négatif (ex. Comptes bloqués). */
export function SettingRow({
  icon,
  label,
  sub,
  right,
  danger = false,
}: {
  icon: IconName
  label: string
  sub?: ReactNode
  right?: ReactNode
  danger?: boolean
}) {
  return (
    <div className="set-row">
      <div className={`set-ico ${danger ? styles.icoDanger : ''}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className={styles.rowText}>
        <div className={styles.rowLabel}>{label}</div>
        {sub != null && <div className={`t-faint ${styles.rowSub}`}>{sub}</div>}
      </div>
      {right != null && <div className={styles.rowRight}>{right}</div>}
    </div>
  )
}

/** Valeur fixe en lecture seule (choix produit définitif : Devise, Langue). Pas un
 *  sélecteur, pas de chevron — n'induit aucune éditabilité (honnêteté). */
export function FixedValue({ children }: { children: ReactNode }) {
  return <span className={styles.fixedValue}>{children}</span>
}
