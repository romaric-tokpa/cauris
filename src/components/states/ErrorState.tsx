import type { ReactNode } from 'react'
import { Icon } from '../primitives'
import { money } from '../../lib/money'
import styles from './states.module.css'

export interface ErrorStateProps {
  title?: string
  account?: string
  available?: number
  requested?: number
  actions?: ReactNode
}

/** État d'erreur — porté À L'IDENTIQUE de screens-states.jsx (défauts = wireframe).
 *  Montants via money(). */
export function ErrorState({
  title = 'Solde insuffisant',
  account = 'Orange Money',
  available = 245000,
  requested = 300000,
  actions,
}: ErrorStateProps) {
  return (
    <div className={styles.block}>
      <div className={styles.state}>
        <div className={`big-ico ${styles.icoNeg}`}>
          <Icon name="alert" size={34} />
        </div>
        <div>
          <div className={styles.titleLg}>{title}</div>
          <div className={`t-faint ${styles.textError}`}>
            Le compte {account} ne dispose que de {money(available)} FCFA pour une dépense de{' '}
            {money(requested)} FCFA.
          </div>
        </div>
      </div>

      <div className="alert over">
        <i className="swatch" />
        <div className={`row-ico ${styles.alertIco}`}>
          <Icon name="wallet" size={16} />
        </div>
        <div>
          <div className={styles.alertName}>{account}</div>
          <div className={`t-muted ${styles.alertSub}`}>Disponible : {money(available)} FCFA</div>
        </div>
      </div>

      {actions ?? (
        <div className={styles.actionsWide}>
          <button type="button" className={`btn primary block ${styles.pad13}`}>
            Changer de compte
          </button>
          <button type="button" className={`btn block ${styles.pad12}`}>
            Modifier le montant
          </button>
        </div>
      )}
    </div>
  )
}
