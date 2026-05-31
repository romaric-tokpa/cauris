import { useId, type ReactNode } from 'react'
import { Overlay } from './Overlay'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  /** Titre visible (sinon fournir `label` pour l'accessibilité). */
  title?: ReactNode
  /** Nom accessible si pas de titre visible. */
  label?: string
  children: ReactNode
}

/** Feuille basse mobile — `.sheet` (+ `sheet-grip`) de components.css, avec a11y. */
export function BottomSheet({ open, onClose, title, label, children }: BottomSheetProps) {
  const titleId = useId()
  return (
    <Overlay
      open={open}
      onClose={onClose}
      panelClassName="sheet"
      labelledBy={title ? titleId : undefined}
      label={title ? undefined : (label ?? 'Feuille')}
    >
      <div className="sheet-grip" aria-hidden="true" />
      {title && (
        <div id={titleId} className="card-title">
          {title}
        </div>
      )}
      {children}
    </Overlay>
  )
}
