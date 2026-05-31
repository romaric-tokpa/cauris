import type { HTMLAttributes } from 'react'

export type BadgeTone = 'ok' | 'warn' | 'over'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone: BadgeTone
}

/** Pastille de statut — wrapper fin sur `.badge` (+ ton) de components.css. */
export function Badge({ tone, className = '', children, ...rest }: BadgeProps) {
  return (
    <span className={`badge ${tone}${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </span>
  )
}

export type TagProps = HTMLAttributes<HTMLSpanElement>

/** Étiquette de catégorie — wrapper fin sur `.tag-cat` de components.css. */
export function Tag({ className = '', children, ...rest }: TagProps) {
  return (
    <span className={`tag-cat${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </span>
  )
}
