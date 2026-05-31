import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `primary` (solid) ou `accent`, sinon bouton neutre. */
  variant?: 'default' | 'primary' | 'accent'
  /** Pleine largeur (`.btn.block`). */
  block?: boolean
}

/** Bouton réel — wrapper fin sur `.btn` (+ `primary`/`accent`/`block`) de components.css.
 *  Le focus visible est fourni par la couche a11y de components.css. */
export function Button({
  variant = 'default',
  block = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'btn',
    variant === 'primary' && 'primary',
    variant === 'accent' && 'accent',
    block && 'block',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  )
}
