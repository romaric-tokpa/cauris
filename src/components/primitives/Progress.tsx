import type { Tone } from './Gauge'

export interface ProgressProps {
  pct: number
  tone?: Tone
}

/** Barre de progression avec ton. Portée À L'IDENTIQUE de wf-lib.jsx. */
export function Progress({ pct, tone = '' }: ProgressProps) {
  return (
    <div className="wf-prog">
      <i className={'wf-prog-fill ' + tone} style={{ width: Math.min(pct, 100) + '%' }} />
    </div>
  )
}
