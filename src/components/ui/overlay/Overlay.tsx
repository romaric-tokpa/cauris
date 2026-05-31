import { useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../primitives'
import { useOverlay } from './useOverlay'
import styles from './Overlay.module.css'

export interface OverlayProps {
  open: boolean
  onClose: () => void
  /** Classe du panneau (`drawer`, `sheet`, ou la classe module du Modal). */
  panelClassName: string
  /** id de l'élément titre (aria-labelledby) … */
  labelledBy?: string
  /** … ou libellé direct si pas de titre visible (aria-label). */
  label?: string
  children: ReactNode
}

/** Racine de couche modale : portail, scrim cliquable, panneau `role="dialog"`
 *  `aria-modal`, focus piégé + restitué, scroll bloqué, `Esc` ferme. */
export function Overlay({
  open,
  onClose,
  panelClassName,
  labelledBy,
  label,
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useOverlay(open, onClose, panelRef)

  if (!open) return null

  return createPortal(
    <div className={styles.overlayRoot}>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Bouton de fermeture réutilisable (× = icône plus pivotée). */
export function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="icon-btn" onClick={onClose} aria-label="Fermer">
      <span className={styles.closeGlyph}>
        <Icon name="plus" size={18} />
      </span>
    </button>
  )
}
