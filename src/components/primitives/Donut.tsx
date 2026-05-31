import type { ReactNode } from 'react'

export interface DonutSegment {
  color: string
  /** Part en pourcentage (0–100). */
  v: number
}

export interface DonutProps {
  segments: DonutSegment[]
  size?: number
  hole?: number
  label?: ReactNode
  sub?: ReactNode
  valSize?: number
}

/** Donut en conic-gradient + trou central optionnel. Porté À L'IDENTIQUE de wf-lib.jsx. */
export function Donut({ segments, size = 132, hole = 0.62, label, sub, valSize }: DonutProps) {
  const stops: string[] = []
  let acc = 0
  segments.forEach((s) => {
    stops.push(`${s.color} ${acc}% ${acc + s.v}%`)
    acc += s.v
  })
  if (acc < 100) stops.push(`var(--line-soft) ${acc}% 100%`)
  const vs = valSize || Math.max(11, Math.round(size * 0.15))
  return (
    <div
      className="wf-donut"
      style={{ width: size, height: size, background: `conic-gradient(${stops.join(',')})` }}
    >
      <div className="wf-donut-hole" style={{ inset: `${(1 - hole) * 50}%` }}>
        {label && (
          <div className="wf-donut-val" style={{ fontSize: vs }}>
            {label}
          </div>
        )}
        {sub && <div className="wf-donut-sub">{sub}</div>}
      </div>
    </div>
  )
}
