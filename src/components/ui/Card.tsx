import type { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante surface douce (`.wf-card.soft`). */
  soft?: boolean
  /** Padding interne : `pad` (18px), `pad-sm` (14px) ou aucun. */
  pad?: 'pad' | 'pad-sm' | false
}

/** Surface carte — wrapper fin sur `.wf-card` (+ `soft`/`wf-pad`) de components.css. */
export function Card({ soft = false, pad = 'pad', className = '', children, ...rest }: CardProps) {
  const cls = [
    'wf-card',
    soft && 'soft',
    pad === 'pad' && 'wf-pad',
    pad === 'pad-sm' && 'wf-pad-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
