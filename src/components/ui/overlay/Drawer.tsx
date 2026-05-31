import { useId, type ReactNode } from 'react'
import { Overlay, CloseButton } from './Overlay'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Pied collé en bas (boutons d'action). */
  footer?: ReactNode
}

/** Tiroir latéral desktop — `.drawer` (+ `drawer-h/b/f`) de components.css, avec a11y. */
export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const titleId = useId()
  return (
    <Overlay open={open} onClose={onClose} panelClassName="drawer" labelledBy={titleId}>
      <header className="drawer-h">
        <div id={titleId} className="card-title">
          {title}
        </div>
        <CloseButton onClose={onClose} />
      </header>
      <div className="drawer-b">{children}</div>
      {footer && <div className="drawer-f">{footer}</div>}
    </Overlay>
  )
}
