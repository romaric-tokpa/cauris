import type { Tone } from './Gauge'

export interface ProgressProps {
  pct: number
  tone?: Tone
  /** Couleur de remplissage explicite via token catégorie ('cat-N' → var(--cat-N)).
   *  Quand fourni, prime sur le ton (cohérence donut). */
  colorToken?: string | null
}

/** Barre de progression avec ton. Portée À L'IDENTIQUE de wf-lib.jsx. */
export function Progress({ pct, tone = '', colorToken }: ProgressProps) {
  const style = {
    width: Math.min(pct, 100) + '%',
    ...(colorToken ? { background: `var(--${colorToken})` } : {}),
  }
  return (
    <div className="wf-prog">
      <i className={'wf-prog-fill ' + tone} style={style} />
    </div>
  )
}
