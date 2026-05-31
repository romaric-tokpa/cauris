import type { ReactNode } from 'react'
import { Icon } from '../primitives'
import { money } from '../../lib/money'
import styles from './states.module.css'

export interface SuccessStateProps {
  title?: string
  message?: string
  amount?: number
  category?: string
  account?: string
  date?: string
  actions?: ReactNode
}

/** État de confirmation — porté À L'IDENTIQUE de screens-states.jsx (défauts = wireframe).
 *  Montant via money() en mono. */
export function SuccessState({
  title = 'Transaction enregistrée',
  message = 'Vos soldes et budgets ont été mis à jour.',
  amount = 25000,
  category = 'Alimentation',
  account = 'Orange Money',
  date = '31 mai 2026',
  actions,
}: SuccessStateProps) {
  return (
    <div className={styles.block}>
      <div className={styles.state}>
        <div className={`big-ico ${styles.icoPos}`}>
          <Icon name="check" size={36} stroke={2.4} />
        </div>
        <div>
          <div className={styles.titleLg}>{title}</div>
          <div className={`t-faint ${styles.textSuccess}`}>{message}</div>
        </div>
      </div>

      <div className="wf-card wf-pad-sm">
        <div className={`set-row ${styles.row}`}>
          <span className={`t-faint ${styles.rowLabel}`}>Montant</span>
          <span className={`t-mono t-neg ${styles.rowAmount}`}>−{money(amount)} FCFA</span>
        </div>
        <div className={`set-row ${styles.row}`}>
          <span className={`t-faint ${styles.rowLabel}`}>Catégorie</span>
          <span className="tag-cat">{category}</span>
        </div>
        <div className={`set-row ${styles.row}`}>
          <span className={`t-faint ${styles.rowLabel}`}>Compte</span>
          <span className={styles.rowVal}>{account}</span>
        </div>
        <div className={`set-row ${styles.row}`}>
          <span className={`t-faint ${styles.rowLabel}`}>Date</span>
          <span className={styles.rowVal}>{date}</span>
        </div>
      </div>

      {actions ?? (
        <div className={styles.actionsWide}>
          <button type="button" className={`btn primary block ${styles.pad13}`}>
            Voir la transaction
          </button>
          <button type="button" className={`btn block ${styles.pad12}`}>
            <Icon name="plus" size={16} /> Nouvelle transaction
          </button>
        </div>
      )}
    </div>
  )
}
