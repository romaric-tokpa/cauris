import { useId, type ReactNode } from 'react'
import { Overlay, CloseButton } from './Overlay'
import styles from './Overlay.module.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Pied d'actions (boutons), aligné à droite. */
  footer?: ReactNode
}

/** Dialogue centré (construction projet, token-only) avec a11y complète. */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId()
  return (
    <Overlay open={open} onClose={onClose} panelClassName={styles.modalPanel} labelledBy={titleId}>
      <div className={styles.modalHead}>
        <div id={titleId} className={styles.modalTitle}>
          {title}
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <div>{children}</div>
      {footer && <div className={styles.modalFoot}>{footer}</div>}
    </Overlay>
  )
}
